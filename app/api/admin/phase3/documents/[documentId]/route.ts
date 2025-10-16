// app/api/admin/phase3/documents/[documentId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { Prisma, ApplicationStatus, DocumentType } from '@prisma/client';

// 1. Schema ตรวจสอบข้อมูลเข้า (เหมือนเดิม)
const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional().nullable(),
});

// 2. 💡 รายการเอกสารเฟส 3 ที่ต้องตรวจ
const PHASE3_DOC_TYPES: DocumentType[] = [
    'PHASE3_CONSENT',   // หนังสือยืนยันสิทธิ์
    'PHASE3_CONTRACT',  // สัญญามอบตัว
    'PHASE3_ENROLLMENT' // ใบมอบตัว
];

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

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let { status, rejectionReason } = validation.data;
  
  if (status === 'REJECTED' && !rejectionReason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }
  if (status === 'APPROVED') {
    rejectionReason = null;
  }

  try {
    // 3. ---- เริ่ม Transaction ----
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 3.1 อัปเดตเอกสารชิ้นนั้นๆ
      const updatedDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          status: status,
          rejectionReason: rejectionReason,
        },
      });

      const applicationId = updatedDocument.applicationId;

      // 3.2 💡 [Logic ใหม่] ดึงเอกสารเฟส 3 "ทั้งหมด" ของนักเรียนคนนี้
      const phase3Docs = await tx.document.findMany({
        where: {
          applicationId: applicationId,
          documentType: {
            in: PHASE3_DOC_TYPES,
          },
        },
      });

      // 3.3 💡 [Logic ใหม่] ตรวจสอบและอัปเดตสถานะหลัก
      let newAppStatus: ApplicationStatus = 'CONFIRMED'; // สถานะเริ่มต้น (รอตรวจ)

      if (phase3Docs.some((doc) => doc.status === 'REJECTED')) {
        // ถ้ามีชิ้นไหนถูก Reject -> สถานะหลักเป็น INCORRECT_DOCS
        newAppStatus = 'INCORRECT_DOCS';
      } else if (
        phase3Docs.length === PHASE3_DOC_TYPES.length && // ส่งครบ 3 ชิ้น
        phase3Docs.every((doc) => doc.status === 'APPROVED') // และผ่านหมด
      ) {
        // 💡 ถ้าครบและผ่านหมด -> สถานะหลักเป็น 'มอบตัวสำเร็จ'
        newAppStatus = 'ENROLLED';
      }
      
      // 3.4 อัปเดตสถานะหลักของ Application
      await tx.application.update({
        where: { id: applicationId },
        data: { applicationStatus: newAppStatus },
      });

      // 3.5 TODO: ส่ง Email แจ้งเตือน (ถ้าต้องการ)
      if (newAppStatus === 'INCORRECT_DOCS') {
        // ...
      } else if (newAppStatus === 'ENROLLED') {
        // ... (ส่งอีเมลแสดงความยินดี)
      }

      return updatedDocument;
    }); // ---- จบ Transaction ----

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Failed to update document status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}