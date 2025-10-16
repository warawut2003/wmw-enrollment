// app/api/admin/phase2/applicants/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma, ApplicationStatus } from '@prisma/client';

// (ฟังก์ชัน GET ถูกแก้ไขใหม่ทั้งหมด)
export async function GET(request: Request) {
    // 1. ตรวจสอบสิทธิ์ (เหมือนเดิม)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. ตรวจสอบปีการศึกษาที่ Active (เหมือนเดิม)
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true },
        });

        if (!activeYear) {
            return NextResponse.json({ data: [], error: 'NO_ACTIVE_YEAR' });
        }

        // 3. 💡 [ใหม่] อ่านค่า Search Params จาก URL
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'ALL'; // ค่าเริ่มต้นคือ 'ALL'

        // 4. 💡 [ใหม่] สร้าง Prisma Where Clause แบบ Dynamic
        let whereClause: Prisma.ApplicationWhereInput = {
            academicYearId: activeYear.id, // กรองเฉพาะปีที่ Active
        };

        // 4.1 เพิ่มเงื่อนไขการกรองสถานะ
        if (status && status !== 'ALL') {
            whereClause.applicationStatus = status as ApplicationStatus;
        }

        // 4.2 เพิ่มเงื่อนไขการค้นหา (Search)
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search } }, // ค้นหาเลขบัตร ปชช.
                { school: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // 5. ดึงข้อมูลด้วย Where Clause ที่สร้างขึ้น
        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                school: true, // ยังคง include school
            },
            orderBy: {
                firstName: 'asc', // เรียงตามชื่อ
            },
        });

        // 6. Format ข้อมูล (เหมือนเดิม)
        const formattedData = applications.map((app) => ({
            id: app.id,
            name: `${app.title}${app.firstName} ${app.lastName}`,
            schoolName: app.school.name,
            examVenue: app.examVenue,
            examRoom: app.examRoom,
            seatNumber: app.seatNumber,
            status: app.applicationStatus,
        }));

        return NextResponse.json({ data: formattedData, error: null });

    } catch (error) {
        console.error("Failed to fetch applicants:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}