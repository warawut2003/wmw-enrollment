// 🔧 MODIFIED: แก้ไข Component นี้ทั้งหมด
"use client";

import Link from 'next/link';

interface ApplicationData {
  prorityRank: number | null;
}

interface SubmissionPeriod {
  start: string | null;
  end: string | null;
}

interface Props {
  application: ApplicationData;
  submissionPeriod: SubmissionPeriod;
}

export default function Phase3DecisionCard({ application, submissionPeriod }: Props) {
  const now = new Date();
  const startDate = submissionPeriod.start ? new Date(submissionPeriod.start) : null;
  const endDate = submissionPeriod.end ? new Date(submissionPeriod.end) : null;

  const isPeriodDefined = startDate && endDate;

  const isBeforePeriod = startDate && now < startDate;
  const isAfterPeriod = endDate && now > endDate;
  const isWithinPeriod = startDate && endDate && !isBeforePeriod && !isAfterPeriod && isPeriodDefined;
  ;

  const getSummaryContent = () => {
    if (!startDate || !endDate) {
      return {
        text: 'ยังไม่เปิดให้ดำเนินการในส่วนนี้ โปรดรอการประกาศจากผู้ดูแลระบบ',
        className: 'bg-gray-50 border-gray-400 text-gray-700',
      };
    }

    if(!isPeriodDefined){
      return {
      text :'ยังไม่เปิดให้ดำเนินการในส่วนนี้ โปรดรอการประกาศจากผู้ดูแลระบบ',
      className : 'bg-gray-50 border-gray-400 text-gray-700'
      }
    }

    if (isBeforePeriod) {
      return {
        text: `จะเปิดให้ดำเนินการในวันที่ ${startDate.toLocaleString('th-TH')}`,
        className: 'bg-yellow-50 border-yellow-500 text-yellow-800',
      };
    }
    if (isAfterPeriod) {
      return {
        text: 'คุณไม่ได้ดำเนินการภายในเวลาที่กำหนด',
        className: 'bg-red-50 border-red-500 text-red-800',
      };
    }
    return {
      text: 'กรุณาดำเนินการ "ยืนยันสิทธิ์" หรือ "สละสิทธิ์" พร้อมแนบเอกสารที่เกี่ยวข้อง',
      className: 'bg-blue-50 border-blue-500 text-blue-800',
    };
  };

  const summary = getSummaryContent();

  return (
    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">ผลการคัดเลือกเข้าศึกษา (เฟส 3)</h2>
      <p className="text-gray-600 mt-1">
        คุณได้รับการคัดเลือกให้เข้าศึกษาในลำดับที่ตัวจริง
        <span className="font-bold text-indigo-600"> {application.prorityRank}</span>
      </p>

      <div className="mt-6 border-t pt-4">
        
        <div className={`p-4 mb-4 border-l-4 rounded-r-lg ${summary.className}`}>
          <p className="font-bold">สรุปสถานะ:</p>
          <p>{summary.text}</p>
        </div>
        
        {isWithinPeriod && (
          <Link
            href="/documents/phase3-submission"
            className="block w-full text-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            ไปยังหน้ายืนยันสิทธิ์
          </Link>
        )}

        {endDate && <p className="text-sm text-center text-gray-500 mt-2">หมดเขตดำเนินการ: {endDate.toLocaleString('th-TH')}</p>}
      </div>
    </div>
  );
}