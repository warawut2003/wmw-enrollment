// app/api/academic-years/route.ts

import { NextResponse } from 'next/server';

import { Prisma } from "@prisma/client"; 
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { z } from 'zod';
import { parseDate } from '@/lib/utils';

// 1. สร้าง Schema สำหรับตรวจสอบข้อมูลฟอร์มด้วย Zod
const academicYearSchema = z.object({
  year: z.coerce.number().int().min(2500), // ใช้ coerce เพื่อแปลง string จาก FormData เป็น number
  name: z.string().min(1, 'Name is required'),
  isActive: z.coerce.boolean().default(false), // แปลง 'true'/'false' เป็น boolean
  phase2StartDate: z.coerce.date().optional(),
  phase2EndDate: z.coerce.date().optional(),
  phase3StartDate: z.coerce.date().optional(),
  phase3EndDate: z.coerce.date().optional(),
});



// 3. API Handler (POST)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('studentFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No student file provided' }, { status: 400 });
    }

    // 4. แปลง FormData เป็น Object ธรรมดาเพื่อ Validate
    const formDataObject = Object.fromEntries(formData.entries());
    const validation = academicYearSchema.safeParse(formDataObject);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid form data', details: validation.error.flatten() }, { status: 400 });
    }

    const { ...academicYearData } = validation.data;

    // 5. อ่านและ Parse ไฟล์ Excel
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records: any[] = xlsx.utils.sheet_to_json(sheet);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    // 6. ---- เริ่ม Transaction ----
    const result = await prisma.$transaction(async (tx) => {
      
      // 6.1 (Optional) ถ้าตั้งเป็น isActive=true, ให้ตั้งค่าอันอื่นเป็น false ทั้งหมด
      if (academicYearData.isActive) {
        await tx.academicYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }
      
      // 6.2 สร้าง AcademicYear
      const newAcademicYear = await tx.academicYear.create({
        data: academicYearData,
      });

      const academicYearId = newAcademicYear.id; // นี่คือ ID ที่เราจะใช้
      let processedCount = 0;

      // 6.3 วนลูปข้อมูลนักเรียนจาก Excel
      for (const record of records) {
        // นำ Logic การสร้าง School จาก seed ของคุณมาใช้
        const schoolName = record['โรงเรียนปัจจุบัน'];
        const schoolProvince = record['จังหวัดโรงเรียนปัจจุบัน'];

        if (!schoolName || !schoolProvince) {
          // ถ้าข้อมูลโรงเรียนไม่ครบ ให้ Rollback transaction
          throw new Error(`Missing school data at row ${processedCount + 2}`);
        }

        let school = await tx.school.findUnique({
          where: { name: schoolName },
        });

        if (!school) {
          school = await tx.school.create({
            data: {
              name: schoolName,
              province: schoolProvince,
            },
          });
        }

        // นำ Logic การ Upsert Application จาก seed ของคุณมาใช้
        const nationalId = record['เลขประจำตัวประชาชน'];
        if (!nationalId) {
          throw new Error(`Missing National ID at row ${processedCount + 2}`);
        }

        await tx.application.upsert({
          where: { nationalId: nationalId },
          update: {
            academicYearId: academicYearId,
          },
          create: {
            nationalId: nationalId,
            title: record['คำนำหน้าชื่อ'],
            firstName: record['ชื่อ'],
            lastName: record['นามสกุล'],
            dateOfBirth: parseDate(record['วันเดือนปีเกิด']),
            email: record['อีเมล'],
            gpaTotal: parseFloat(record['ผลการเรียนเฉลี่ยรวม']) || null,
            gpaMath: parseFloat(record['ผลการเรียนเฉลี่ยคณิตศาสตร์']) || null,
            gpaScience: parseFloat(record['ผลการเรียนเฉลี่ยวิทยาศาสตร์']) || null,
            pdpaConsent: true, // ตั้งค่าเริ่มต้นตามที่คุยกัน
            schoolId: school.id,
            academicYearId: academicYearId, // <-- นี่คือจุดเชื่อมโยงสำคัญ
          },
        });
        processedCount++;
      } // end loop

      // 6.4 คืนค่าเมื่อสำเร็จ
      return {
        ...newAcademicYear,
        studentsImported: processedCount,
      };
    }); // ---- สิ้นสุด Transaction ----

    // 7. ส่งคำตอบกลับ
    return NextResponse.json(
      { message: 'Academic Year created and students imported successfully', data: result },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Failed to create academic year:", error);
    
    // ส่ง Error ที่มนุษย์อ่านเข้าใจได้
    let errorMessage = "An unexpected error occurred.";
    if (error.message.includes('Missing school data') || error.message.includes('Missing National ID')) {
      errorMessage = error.message; // ส่ง Error จากใน transaction
    } else if (error.code === 'P2002' && error.meta?.target.includes('year')) {
      errorMessage = 'An academic year with this year already exists.'; // Error จาก DB (Unique constraint)
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}