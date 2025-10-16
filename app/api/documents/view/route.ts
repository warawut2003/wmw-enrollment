import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ message: 'Document ID is required' }, { status: 400 });
        }

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                application: { select: { userId: true } }
            }
        });

        if (!document || !document.application) {
            return NextResponse.json({ message: 'Document not found' }, { status: 404 });
        }

        const isOwner = document.application.userId === session.user.id;
        const isAdmin = session.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin.storage
            .from('student-documents')
            .createSignedUrl(document.fileUrl, 60);

        if (error) {
            throw error;
        }

        return NextResponse.json({ signedUrl: data.signedUrl });

    } catch (err) {
        console.error("Error creating signed URL:", err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}