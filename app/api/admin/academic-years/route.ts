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
      const academicYear = await tx.academicYear.create({
        data: academicYearData,
      });

      const academicYearId = academicYear.id;
      let processedCount = 0;

      // ---- Optimization Start ----

      // 1. รวบรวมข้อมูล school และ nationalId ทั้งหมดก่อน
      const schoolDataMap = new Map<string, { name: string; province: string }>();
      const nationalIds = new Set<string>();
      records.forEach(record => {
        const schoolName = record['โรงเรียนปัจจุบัน'];
        const schoolProvince = record['จังหวัดโรงเรียนปัจจุบัน'];
        if (schoolName && !schoolDataMap.has(schoolName)) {
          schoolDataMap.set(schoolName, { name: schoolName, province: schoolProvince });
        }
        const nationalId = record['เลขประจำตัวประชาชน'];
        if (nationalId) {
          nationalIds.add(nationalId);
        }
      });

      // 2. จัดการ School ทั้งหมดในครั้งเดียว (Find or Create)
      const schoolNames = Array.from(schoolDataMap.keys());
      const existingSchools = await tx.school.findMany({
        where: { name: { in: schoolNames } },
      });

      const existingSchoolNames = new Set(existingSchools.map(s => s.name));
      const newSchoolsData = schoolNames
        .filter(name => !existingSchoolNames.has(name))
        .map(name => schoolDataMap.get(name)!);

      if (newSchoolsData.length > 0) {
        await tx.school.createMany({
          data: newSchoolsData,
        });
      }

      const allSchools = await tx.school.findMany({
        where: { name: { in: schoolNames } },
      });
      const schoolNameToIdMap = new Map(allSchools.map(s => [s.name, s.id]));

      // 3. อัปเดต Application ที่มีอยู่แล้ว
      await tx.application.updateMany({
        where: { nationalId: { in: Array.from(nationalIds) } },
        data: { academicYearId: academicYearId },
      });

      // 4. สร้าง Application ใหม่ (เฉพาะที่ยังไม่มี)
      const applicationsToCreate = [];
      for (const record of records) {
        const nationalId = record['เลขประจำตัวประชาชน'];
        if (!nationalId || !record['โรงเรียนปัจจุบัน']) continue;

        const schoolId = schoolNameToIdMap.get(record['โรงเรียนปัจจุบัน']);
        if (!schoolId) {
            throw new Error(`Could not find or create school: ${record['โรงเรียนปัจจุบัน']}`);
        }

        // เราจะใช้ create แทน upsert โดยใช้ onConflict เพื่อประสิทธิภาพ
        // แต่เนื่องจาก upsert ใน loop ช้า เราจะเปลี่ยนไปใช้ updateMany + createMany
        // ในที่นี้เราจะรวบรวมข้อมูลเพื่อ createMany
        applicationsToCreate.push({
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
            schoolId: schoolId,
            academicYearId: academicYearId,
        });
      }

      if (applicationsToCreate.length > 0) {
        const createResult = await tx.application.createMany({
          data: applicationsToCreate,
          skipDuplicates: true, // ถ้ามี nationalId ซ้ำอยู่แล้ว ให้ข้ามไป
        });
        processedCount = createResult.count;
      }

      // ---- Optimization End ----

      // 6.4 คืนค่าเมื่อสำเร็จ
      return {
        ...academicYear,
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