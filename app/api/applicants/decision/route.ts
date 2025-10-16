import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { decision } = await req.json();
        if (decision !== 'CONFIRMED' && decision !== 'WITHDRAWN') {
            return NextResponse.json({ message: 'Invalid decision' }, { status: 400 })
        }

        const finalStatus = decision === 'CONFIRMED' ? 'PENDING_APPROVAL' : 'WITHDRAWN';

        await prisma.application.update({
            where: { userId: session.user.id },
            data: {
                applicationStatus: finalStatus,
            }
        });

        return NextResponse.json({ message: 'Decision saved successfully' }, { status: 200 })
    }catch (error){
        console.error("Error saving decision:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
    
}