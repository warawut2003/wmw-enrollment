import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client"; 

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse("Missing token", { status: 400 });
        }

        const existingToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!existingToken) {
            return new NextResponse("Invalid token", { status: 400 });
        }

        const hasExpired = new Date(existingToken.expires) < new Date();

        if (hasExpired) {
            await prisma.verificationToken.delete({ where: { token } });
            return new NextResponse("Token has expired", { status: 400 });
        }

        const application = await prisma.application.findUnique({
            where: { nationalId: existingToken.nationalId }
        });

        if (!application) {
            return new NextResponse("Application data not found for this token", { status: 404 });
        }

        if (application.userId) {
            return new NextResponse("Application already registered", { status: 409 });
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const newUser = await tx.user.create({
                data: {
                    email: existingToken.identifier,
                    password: existingToken.hashedPassword,
                    role: 'STUDENT',
                    emailVerified: new Date(),
                },
            });

            await tx.application.update({
                where: { id: application.id },
                data: {
                    userId: newUser.id,
                    laserCode: existingToken.laserCode,
                    pdpaConsent: true,
                },
            });

            await tx.verificationToken.delete({ where: { token } });
        });

        const loginUrl = new URL("/sign-in", process.env.NEXTAUTH_URL);
        loginUrl.searchParams.set("verified", "true");
        return NextResponse.redirect(loginUrl);
    } catch (error) {
        console.error("Verification Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}