import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params} : {params : { nationalId : string}}){
    try{
        const { nationalId } = params;
        if (!nationalId || nationalId.length !== 13) {
            return NextResponse.json(
                { message: 'กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)' },
                { status: 400 } // Bad Request
            );
        }

        const applicant = await prisma.application.findUnique({
            where : { nationalId : nationalId,},
            include :{
                school : true,
            },
        });
        if(!applicant){
            return NextResponse.json(
                {message : 'ไม่พบข้อมูลผู้สมัครในระบบ กรุณาตรวจสอบเลขบัตรประชาชน'},
                {status: 404},
            );
        }

        if(applicant.userId){
            return NextResponse.json(
                {message : 'เลขบัตรประชาชนนี้ได้ทำการลงทะเบียนไปแล้ว'},
                {status: 400},
            );
        }

        return NextResponse.json(applicant, {status : 200});
    }catch(error){
        console.error('Error fetching applicant:', error);
        return NextResponse.json(
            {message : 'เกิดข้อผิดพลาดจากทางเซิร์ฟเวอร์'},
            {status : 500}
        )
    }
} 