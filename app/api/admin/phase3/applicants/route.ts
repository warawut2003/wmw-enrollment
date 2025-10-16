// app/api/admin/phase3/applicants/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma, ApplicationStatus } from '@prisma/client';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true },
        });

        if (!activeYear) {
            return NextResponse.json({ data: [], error: 'NO_ACTIVE_YEAR' });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'ALL';

        // 💡 1. [สำคัญ] สร้าง Where Clause
        let whereClause: Prisma.ApplicationWhereInput = {
            academicYearId: activeYear.id,
            prorityRank: { // 👈 กรองเฉพาะ 80 คนที่มีลำดับที่
                not: null,
            },
        };

        // 2. เพิ่มการกรองสถานะ (เฟส 3)
        if (status && status !== 'ALL') {
            whereClause.applicationStatus = status as ApplicationStatus;
        }

        // 3. เพิ่มการค้นหา
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search } },
            ];
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                school: true,
            },
            orderBy: {
                prorityRank: 'asc', // 👈 4. เรียงตามลำดับที่
            },
        });

        // 5. Format ข้อมูล
        const formattedData = applications.map((app) => ({
            id: app.id,
            rank: app.prorityRank, // 👈 ส่งลำดับที่ไปด้วย
            name: `${app.title}${app.firstName} ${app.lastName}`,
            schoolName: app.school.name,
            status: app.applicationStatus,
        }));

        return NextResponse.json({ data: formattedData, error: null });

    } catch (error) {
        console.error("Failed to fetch phase 3 applicants:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}