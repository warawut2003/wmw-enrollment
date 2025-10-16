// app/api/admin/phase2/applicants/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. ตรวจสอบสิทธิ์ Admin (สำคัญมาก)
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    // 2. ดึงข้อมูล Application โดยใช้ ID ที่ส่งมา
    const application = await prisma.application.findUnique({
      where: { id: id },
      include: {
        school: true, // ดึงข้อมูลโรงเรียน
        documents: {   // ดึงเอกสารทั้งหมดที่เกี่ยวข้อง
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // 3. ส่งข้อมูลกลับไปเป็น JSON
    return NextResponse.json(application);

  } catch (error) {
    console.error('Failed to fetch applicant details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}