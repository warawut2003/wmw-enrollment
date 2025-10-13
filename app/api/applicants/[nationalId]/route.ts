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
    }catch(error){

    }
} 