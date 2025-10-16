"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import DocumentStatusList from '@/components/dashboard/DocumentStatusList';
import ExamInfoCard from '@/components/dashboard/ExamInfoCard';
import Phase3DecisionCard from '@/components/dashboard/Phase3DecisionCard';
import Phase3DocumentStatus from '@/components/dashboard/Phase3DocumentStatus';


interface DocumentData {
  id: string;
  documentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
}

interface ApplicationData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  applicationStatus: string;
  examVenue: string | null;
  examRoom: string | null;
  seatNumber: string | null;
  prorityRank: number | null;
  school: {
    name: string;
    province: string;
  },
  academicYear: {
    phase2StartDate: string | null;
    phase2EndDate: string | null;
    phase3StartDate: string | null;
    phase3EndDate: string | null;
  },
  documents: DocumentData[];
}



export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const res = await fetch('/api/me');

        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
        }

        const appData = await res.json();
        setApplication(appData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (status == 'authenticated') {
      fetchApplicationData();
    } else if (status === 'unauthenticated') {
      router.replace('/sign-in');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <main className="flex items-center justify-center h-screen"><Spinner size='lg' /></main>;
  }
  if (error) {
    return <main className="flex items-center justify-center h-screen"><p className="text-red-500">เกิดข้อผิดพลาด: {error}</p></main>;
  }

  const WaitingListComponent = () => (
    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <h2 className="text-xl font-semibold text-gray-800">สถานะ: ตัวสำรอง (ลำดับที่ {application?.prorityRank})</h2>
      <p className="mt-2 text-gray-600">
        ท่านได้รับการคัดเลือกเป็นตัวสำรอง กรุณารอการประกาศเรียกยืนยันสิทธิ์อีกครั้งหากมีผู้สละสิทธิ์
      </p>
    </div>
  );

  const WithdrawnComponent = () => (
    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
        <h2 className="text-xl font-semibold text-gray-800">สถานะ: สละสิทธิ์</h2>
        <p className="mt-2 text-gray-600">
            ท่านได้ทำการสละสิทธิ์การเข้าศึกษาเรียบร้อยแล้ว ขอขอบคุณที่ให้ความสนใจ
        </p>
    </div>
  );

  return (
    <main className='container mx-auto p-4 md:p-8'>
      <h1 className='text-3xl font-bold text-gray-800 mb-2'>
        ยินดีต้อนรับ, {application?.firstName} {application?.lastName}
      </h1>
      <p className='text-lg text-gray-600 mb-8'>
        นี่คือหน้าสรุปข้อมูลการสมัครของคุณ
      </p>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {application && (() => {
          switch (application.applicationStatus) {
            case 'AWAITING_PHASE3_DECISION':
              // ถ้าต้องตัดสินใจ -> แสดงการ์ดเฟส 3
              return <Phase3DecisionCard
                application={application}
                submissionPeriod={{
                  start: application.academicYear?.phase3StartDate || null,
                  end: application.academicYear?.phase3EndDate || null,
                }}
              />;
            case 'WAITING_LIST':
              // ถ้าเป็นตัวสำรอง -> แสดงการ์ดตัวสำรอง
              return <WaitingListComponent />;
            case 'ELIGIBLE_FOR_EXAM':
              // ถ้ามีสิทธิ์สอบ -> แสดงข้อมูลสอบ (ของเดิม)
              return <ExamInfoCard application={application} />;
            case 'WITHDRAWN':
                return <WithdrawnComponent />;
            default:
              return null;
          }
        })()}

        <div className='md:col-span-1 bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4 border-b pb-2'>ข้อมูลผู้สมัคร</h2>
          <div className='space-y-3'>
            <p><strong>ชื่อ-สกุล:</strong> {application?.title}{application?.firstName} {application?.lastName}</p>
            <p><strong>โรงเรียน:</strong> {application?.school?.name}</p>
            <p><strong>จังหวัด:</strong> {application?.school?.province}</p>
          </div>
        </div>

        {application && !['WITHDRAWN'].includes(application.applicationStatus) && (() =>{
          const phase3RelatedStatuses = [
            'CONFIRMED',
            'PENDING_APPROVAL',
            'INCORRECT_DOCS',
            'ENROLLED'
          ];

          if (phase3RelatedStatuses.includes(application.applicationStatus)) {
            return <Phase3DocumentStatus
              application={application}
              submissionPeriod={{
                start: application.academicYear?.phase3StartDate || null,
                end: application.academicYear?.phase3EndDate || null,
              }}
            />
          } else {
            return <DocumentStatusList
              application={application}
              submissionPeriod={{
                start: application.academicYear?.phase2StartDate || null,
                end: application.academicYear?.phase2EndDate || null,
              }}
            />
          }
        })()}
      </div>
    </main>
  )
}