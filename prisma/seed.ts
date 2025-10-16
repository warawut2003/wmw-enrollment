import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import path from "path";
import XLSX from 'xlsx';


const prisma = new PrismaClient();

interface ApplicantRecord {
    'เลขประจำตัวประชาชน': string;
    'คำนำหน้าชื่อ': string;
    'ชื่อ': string;
    'นามสกุล': string;
    'วันเดือนปีเกิด': string;
    'อีเมล': string;
    'โรงเรียนปัจจุบัน': string;
    'จังหวัดโรงเรียนปัจจุบัน': string;
    'ผลการเรียนเฉลี่ยรวม': string;
    'ผลการเรียนเฉลี่ยคณิตศาสตร์': string;
    'ผลการเรียนเฉลี่ยวิทยาศาสตร์': string;
}


function parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    try {
        const [day, month, year] = dateString.split('/');
        if (!day || !month || !year) return null;
        const yearInt = parseInt(year, 10);
        return new Date(Date.UTC(yearInt, parseInt(month, 10) - 1, parseInt(day, 10)));
    } catch (e) {
        console.error(`Could not parse date: "${dateString}"`);
        return null;
    }
}

async function seedAdmin() {
  console.log("🌐 Seeding admin user...");
  const email = "admin_wmw@tsu.ac.th";
  const password = "12345678";

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: "ADMIN", // ต้องมี field role ใน model user
      emailVerified: new Date(), // ให้ถือว่ายืนยันแล้ว
    },
  });
  console.log(`✅ Admin created: ${email} (password: ${password})`);
}

async function importApplicantsFromExcel(prisma: PrismaClient, academicYearId: number) { 
    console.log('Reading applicant data from xlsx...');

   const excelPath = path.join(__dirname, 'data', 'applicants-data.xlsx');


    const workbook = XLSX.readFile(excelPath);
    const sheetName = 'หลัก'; // 👈 3. ระบุชื่อ Sheet ที่ต้องการใช้
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in the Excel file!`);
  }

    const records: ApplicantRecord[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Found ${records.length} records in sheet "${sheetName}" to process.`);


    console.log(`Found ${records.length} records to process.`);

    for (const record of records) {
        if (!record['เลขประจำตัวประชาชน']) continue;
        try {
            let school = await prisma.school.findUnique({
                where: { name: record['โรงเรียนปัจจุบัน'] },
            });
            
            if(!school) {
                school = await prisma.school.create({
                    data:{
                        name: record['โรงเรียนปัจจุบัน'],
                        province: record['จังหวัดโรงเรียนปัจจุบัน'],
                    },
                });
            }

            await prisma.application.upsert({
                where : { nationalId : record['เลขประจำตัวประชาชน'] },
                update : {},
                create: {
                    nationalId : record['เลขประจำตัวประชาชน'],
                    title : record['คำนำหน้าชื่อ'],
                    firstName : record['ชื่อ'],
                    lastName: record['นามสกุล'],
                    dateOfBirth: parseDate(record['วันเดือนปีเกิด']),
                    email: record['อีเมล'],
                    gpaTotal: parseFloat(record['ผลการเรียนเฉลี่ยรวม']) || null,
                    gpaMath: parseFloat(record['ผลการเรียนเฉลี่ยคณิตศาสตร์']) || null,
                    gpaScience: parseFloat(record['ผลการเรียนเฉลี่ยวิทยาศาสตร์']) || null,
                    pdpaConsent: true,
                    schoolId: school.id,
                    academicYearId: academicYearId,
                },
            });
        } catch (e) {
            console.error(`Failed to import record for National ID ${record['เลขประจำตัวประชาชน']}:`, e);
        }
    }
    console.log('Applicant import finished.');
}

async function main(){
    console.log('Start seeding...');

    // เราจะ seed admin user เป็นหลัก
    await seedAdmin();

    // หากต้องการ import ข้อมูลจาก Excel ให้ uncomment บรรทัดด้านล่างแล้วรัน `npx prisma db seed` อีกครั้ง
    // const academicYear = await prisma.academicYear.findFirst(); // หรือหาวิธีระบุ academicYearId ที่ถูกต้อง
    // if (academicYear) {
    //   await importApplicantsFromExcel(prisma, academicYear.id);
    // }

    console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});