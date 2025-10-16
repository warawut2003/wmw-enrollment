// app/api/admin/documents/[documentId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { z } from 'zod';
import { Prisma, ApplicationStatus } from '@prisma/client';

// 1. สร้าง Schema ตรวจสอบข้อมูลเข้า
const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = params;
  const body = await request.json();

  // 2. ตรวจสอบข้อมูลด้วย Zod
  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let { status, rejectionReason } = validation.data;

  // 3. ถ้า Reject แต่ไม่ให้เหตุผล ให้บังคับใส่
  if (status === 'REJECTED' && !rejectionReason) {
    return NextResponse.json(
      { error: 'Rejection reason is required' },
      { status: 400 }
    );
  }
  // ถ้า Approve ให้ล้างเหตุผลทิ้ง
  if (status === 'APPROVED') {
    rejectionReason = null;
  }

  try {
    // 4. ---- เริ่ม Transaction ----
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 4.1 อัปเดตเอกสารชิ้นนั้นๆ
      const updatedDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          status: status,
          rejectionReason: rejectionReason,
        },
      });

      const applicationId = updatedDocument.applicationId;

      // 4.2 ดึงเอกสารเฟส 2 "ทั้งหมด" ของนักเรียนคนนี้
      const phase2Docs = await tx.document.findMany({
        where: {
          applicationId: applicationId,
          documentType: {
            in: ['PHASE2_PAYMENT_SLIP', 'PHASE2_CONFIRMATION'],
          },
        },
      });

      // 4.3 ตรวจสอบและอัปเดตสถานะหลัก (ApplicationStatus)
let newAppStatus: ApplicationStatus = 'PENDING_APPROVAL';
      if (phase2Docs.some((doc) => doc.status === 'REJECTED')) {
        // ถ้ามีชิ้นไหนถูก Reject -> สถานะหลักเป็น INCORRECT_DOCS
        newAppStatus = 'INCORRECT_DOCS';
      } else if (
        phase2Docs.length === 2 &&
        phase2Docs.every((doc) => doc.status === 'APPROVED')
      ) {
        // ถ้าครบ 2 ชิ้น และทุกชิ้น 'APPROVED' -> สถานะหลักเป็น 'มีสิทธิ์สอบ'
        newAppStatus = 'ELIGIBLE_FOR_EXAM';
      }
      // (ถ้าไม่ใช่ทั้ง 2 กรณี, สถานะจะยังคงเป็น PENDING_APPROVAL)

      // 4.4 อัปเดตสถานะหลักของ Application
      await tx.application.update({
        where: { id: applicationId },
        data: { applicationStatus: newAppStatus },
      });

      // 5. TODO: ส่ง Email แจ้งเตือนนักเรียน
      if (newAppStatus === 'INCORRECT_DOCS') {
        // เขียนโค้ดส่ง Email ที่นี่
        // (เช่น ใช้ Resend, Nodemailer)
      }

      return updatedDocument;
    }); // ---- จบ Transaction ----

    return NextResponse.json(result);

  } catch (error) {
    console.error('Failed to update document status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}