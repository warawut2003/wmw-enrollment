import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req:Request) {
    try{
        const session = await getServerSession(authOptions);

        if(!session || !session.user?.id){
            return NextResponse.json({message : 'Unauthorized'}, {status : 401})
        }

        const application = await prisma.application.findUnique({
            where : {
                userId : session.user.id,
            },

            include : {
                school : true,
                documents : true,
                academicYear: true,
            }
        });

        if(!application){
            return NextResponse.json({message : 'Application not found'},{ status: 404 });
        }

        return NextResponse.json(application, {status : 200});
    }catch(error){
        console.error("Error fetching user application : ", error);
        return NextResponse.json({message : 'Internal Server Error'}, {status : 500});
    }
}