import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

import { PrismaClient, DocumentType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const application = await prisma.application.findUnique({
            where: { userId: session.user.id },
            include: {
                documents: true,
                academicYear: true,
            }
        });

        if (!application || !application.academicYear) {
            return NextResponse.json({ message: 'Application or Academic Year not found' }, { status: 404 });
        }

        const _formData = await req.formData();
        const file = _formData.get('file') as File | null;
        const documentType = _formData.get('documentType') as string | null;

        if (!file || !documentType) {
            return NextResponse.json({ message: 'Missing file or document type' }, { status: 400 });
        }

        const {phase2StartDate , phase2EndDate, phase3StartDate, phase3EndDate } = application.academicYear;
        const now = new Date();

        if (documentType.startsWith('PHASE2')) {
            if (!phase2StartDate || !phase2EndDate || now < phase2StartDate || now > phase2EndDate) {
                return NextResponse.json({ message: 'อยู่นอกช่วงเวลาการส่งเอกสารสำหรับเฟส 2' }, { status: 403 });
            }
        } else if (documentType.startsWith('PHASE3')) {
            if (!phase3StartDate || !phase3EndDate || now < phase3StartDate || now > phase3EndDate) {
                return NextResponse.json({ message: 'อยู่นอกช่วงเวลาการส่งเอกสารสำหรับเฟส 3' }, { status: 403 });
            }
        }


        const existingDoc = application.documents.find(doc => doc.documentType === documentType);

        if (existingDoc && existingDoc.status !== 'REJECTED') {
            return NextResponse.json({ message: `คุณได้ส่งเอกสารประเภท ${documentType} แล้ว และกำลังรอการตรวจสอบ` }, { status: 403 });
        }


        console.log("Received documentType from frontend:", documentType);

        const filePath = `${session.user.id}/${documentType}-${randomUUID()}.pdf`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('student-documents')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        await prisma.document.upsert({
            where: {
                applicationId_documentType: {
                    applicationId: application.id,
                    documentType: documentType as DocumentType,
                }
            },
            update: {
                fileName: filePath,
                fileUrl: filePath,
                status: 'PENDING',
                rejectionReason: null,
            },
            create: {
                applicationId: application.id,
                fileName: filePath,
                fileUrl: filePath,
                documentType: documentType as DocumentType,
            }
        });

        const updatableStatuses = ['AWAITING_PHASE2_DOCS', 'INCORRECT_DOCS'];
        if (updatableStatuses.includes(application.applicationStatus)) {
            await prisma.application.update({
                where: { id: application.id },
                data: { applicationStatus: 'PENDING_APPROVAL' }
            });
        }

        return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}