// app/api/admin/phase2/update-seating/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  // 1. ตรวจสอบสิทธิ์ (ต้องเป็น ADMIN เท่านั้น)
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('seatingFile') as File | null;

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

    // 3. ---- เริ่ม Transaction (สำคัญมาก) ----
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let rowNum = 2; // เริ่มนับที่แถว 2 (แถว 1 คือ Header)

      for (const record of records) {
        // 4. ดึงข้อมูลจากแต่ละแถว (ต้องตรงกับชื่อคอลัมน์ใน Excel)
        const nationalId = record['เลขประจำตัวประชาชน']?.toString();
        const examVenue = record['สนามสอบ']?.toString() || null;
        const examRoom = record['หมายเลขห้องสอบ']?.toString() || null;
        const seatNumber = record['หมายเลขที่นั่ง']?.toString() || null;

        if (!nationalId) {
          throw new Error(`Row ${rowNum}: ไม่พบคอลัมน์ 'เลขประจำตัวประชาชน'`);
        }

        // 5. อัปเดตข้อมูลนักเรียนโดยใช้ National ID
        // เราใช้ update (ไม่ใช่ updateMany) เพื่อให้มัน Error
        // ถ้าหา nationalId ไม่เจอ (P2025)
        await tx.application.update({
            where: { nationalId: nationalId }, // 1. หาเจอ
            data: {
                examVenue: examVenue,   // 2. อัปเดตด้วยค่าที่อ่านมา
                examRoom: examRoom,     //    (ซึ่งอาจจะเป็น null)
                seatNumber: seatNumber, //    (ซึ่งอาจจะเป็น null)
            },
        });

        updatedCount++;
        rowNum++;
      } // end loop
    }); // ---- สิ้นสุด Transaction ----

    // 6. ส่งคำตอบกลับ
    return NextResponse.json(
      { message: `อัปเดตข้อมูลห้องสอบสำเร็จ ${updatedCount} รายการ` },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Failed to update seating:", error);

    // 7. จัดการ Error (สำคัญมาก)
    let errorMessage = "An unexpected error occurred.";

    if (error.code === 'P2025') {
      // P2025 คือ "Record to update not found"
      errorMessage = `ข้อมูลผิดพลาด: ไม่พบนักเรียนบางคนในฐานข้อมูล (เช่น ${error.meta?.cause || '...'}) ระบบได้ยกเลิกการอัปเดตทั้งหมด กรุณาตรวจสอบไฟล์ Excel`;
    } else if (error.message.startsWith('Row')) {
      // Error ที่เราโยนเอง
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}