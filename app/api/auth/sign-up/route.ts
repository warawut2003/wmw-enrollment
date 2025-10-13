import {NextResponse} from "next/server";
import { Prisma,PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SignUpRequestBody {
    nationalId : string;
    lasercode? : string;
    email : string;
    password : string;
    pdpaConsent : boolean;
}


export async function POST(req: Request){
    try{
        const body: SignUpRequestBody = await req.json();
        const {nationalId, lasercode, email, password, pdpaConsent} = body;

        if(!nationalId || !email || !password){
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
            const createUser = await tx.user.create({
                data : {
                    email : email,
                    password : hashedPassword,
                    role : 'STUDENT',
                },
            });

            await tx.application.update({
                where : {
                    id : application.id,
                },
                data : {
                    userId : createUser.id,
                    laserCode: lasercode,
                    pdpaConsent: true,
                },
            });
            return createUser;
        });
        return NextResponse.json({
            message : 'ลงทะเบียนสำเร็จ',
            user : {
                email: newUser.email
            }
        }, {status: 201})
    } catch (error) {
        console.error('Error during sign-up:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' }, { status: 500 });
    }
}
