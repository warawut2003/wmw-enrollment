import {NextResponse} from "next/server";
import { Prisma,PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

const prisma = new PrismaClient();

interface SignUpRequestBody {
    nationalId : string;
    email : string;
}


export async function POST(req: Request){
    try{
        const body =  await req.json();
        const {nationalId, lasercode, email, password, confirmPassword, pdpaConsent} = body;

        if (password !== confirmPassword) {
            return NextResponse.json({ message: 'รหัสผ่านและรหัสยืนยันไม่ตรงกัน' }, { status: 400 });
        }

        if(!nationalId || !email || !password ){
            return NextResponse.json({message : 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'}, {status: 400});
        }

        if(password.length < 8){
            return NextResponse.json({ message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
        }

        if(!pdpaConsent){
            return NextResponse.json({message : 'คุณต้องยอมรับนโยบายความเป็นส่วนตัว (PDPA) เพื่อดำเนินการลงทะเบียน'}, {status: 400});
        }

        const application = await prisma.application.findUnique({
            where : { nationalId : nationalId}
        });

        if (!application) {
            return NextResponse.json({ message: 'ไม่พบข้อมูลผู้สมัครในระบบ กรุณาตรวจสอบเลขบัตรประชาชน' }, { status: 404 });
        }

        if(application.userId){
            return  NextResponse.json({ message: 'เลขบัตรประชาชนนี้ได้ทำการลงทะเบียนไปแล้ว' }, { status: 409 });
        }

        const existingUser = await prisma.user.findUnique({
            where : { email : email}
        });

        if(existingUser){
            return NextResponse.json({message : 'อีเมลนี้ถูกใช้งานแล้ว'}, {status: 409});
        }

        const verificationToken  = randomUUID();
        const expires = new Date(new Date().getTime() +3600 *1000);

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.verificationToken.create({
            data : {
                identifier: email,
                token: verificationToken,
                expires,
                hashedPassword : hashedPassword,
                nationalId : nationalId,
                laserCode : lasercode,
                
            }
        });

        await sendVerificationEmail(email, verificationToken);
        
        return NextResponse.json(
            { message: 'ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบกล่องข้อความของคุณ' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error during sign-up request:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการส่งคำขอลงทะเบียน' }, { status: 500 });
    }
}
