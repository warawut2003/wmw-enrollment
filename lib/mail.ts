import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    host : process.env.SMTP_HOST,
    port : Number(process.env.SMTP_PORT),
    auth : {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendVerificationEmail = async (email: string, token : string) =>{
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from :'WMW Enrollment <'+ process.env.SMTP_USER + '>',
        to : email,
        subject :  'ยืนยันอีเมลเพื่อลงทะเบียน',
        html : `<p>กรุณาคลิกที่ลิงก์นี้เพื่อยืนยันการลงทะเบียน: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    })
}