// app/api/admin/phase3/applicants/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 💡 1. [เพิ่มบรรทัดนี้]
// สั่งให้ Next.js ทำงานแบบ Dynamic (ห้าม Caching)
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const application = await prisma.application.findUnique({
      where: { id: id },
      include: {
        school: true, 
        documents: {   
          orderBy: {
            createdAt: 'asc',
          },
        },
      },

    });

    if (!application) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Failed to fetch applicant details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}