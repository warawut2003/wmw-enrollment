// app/api/admin/phase3/import-results/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma, ApplicationStatus } from '@prisma/client';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  // 1. ตรวจสอบสิทธิ์ (ต้องเป็น ADMIN เท่านั้น)
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('resultsFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. อ่านและ Parse ไฟล์ Excel
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records: any[] = xlsx.utils.sheet_to_json(sheet);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    let updatedCount = 0;
    let rank = 1; // 💡 ลำดับจะเริ่มนับจาก 1

    // 3. ---- เริ่ม Transaction (สำคัญมาก) ----
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // 3.1 (Optional แต่แนะนำ)
      // เคลียร์ค่า prorityRank และสถานะของทุกคน (ในโครงการ) ที่อาจจะหลงมาจากเฟส 2
      // เพื่อป้องกันการซ้ำซ้อน
      const activeYear = await tx.academicYear.findFirst({ where: { isActive: true }});
      if(activeYear) {
        await tx.application.updateMany({
            where: { academicYearId: activeYear.id },
            data: {
                prorityRank: null, // ล้างลำดับเก่า
                // อาจจะตั้งสถานะทุกคนกลับไปเป็นค่าเริ่มต้นก่อน (เช่น ELIGIBLE_FOR_EXAM)
            }
        });
      }

      // 3.2 วนลูปตามแถวใน Excel
      for (const record of records) {
        // 4. ดึงข้อมูลจากแต่ละแถว (ต้องการแค่ 'เลขประจำตัวประชาชน')
        const nationalId = record['เลขประจำตัวประชาชน']?.toString();

        if (!nationalId) {
          throw new Error(`แถวที่ ${rank + 1}: ไม่พบคอลัมน์ 'เลขประจำตัวประชาชน'`);
        }

        // 5. 💡 กำหนดสถานะตามลำดับ
        // 1-30 = ตัวจริง (รอตัดสินใจ), 31-80 = ตัวสำรอง
        const newStatus: ApplicationStatus = (rank <= 30) 
            ? 'AWAITING_PHASE3_DECISION' 
            : 'WAITING_LIST';

        // 6. อัปเดตข้อมูลนักเรียน
        try {
            await tx.application.update({
                where: { nationalId: nationalId },
                data: {
                    prorityRank: rank, // 💡 ใส่ลำดับที่
                    applicationStatus: newStatus, // 💡 ใส่สถานะใหม่
                },
            });
        } catch (error: any) {
             if (error.code === 'P2025') { 
                // P2025 คือ "Record to update not found"
                throw new Error(`แถวที่ ${rank + 1}: ไม่พบนักเรียนที่มีเลขประชาชน ${nationalId} ในระบบ`);
             }
             throw error; // โยน Error อื่นๆ
        }

        updatedCount++;
        rank++; // 💡 เพิ่มลำดับ
      } // end loop
    }); // ---- สิ้นสุด Transaction ----

    // 7. ส่งคำตอบกลับ
    return NextResponse.json(
      { message: `อัปเดตผลการคัดเลือก (เฟส 3) สำเร็จ ${updatedCount} รายการ` },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Failed to import results:", error);

    // 8. จัดการ Error
    let errorMessage = "An unexpected error occurred.";
    if (error.message.includes('ไม่พบนักเรียน')) {
        errorMessage = error.message; // ส่ง Error ที่เราสร้างเอง
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}