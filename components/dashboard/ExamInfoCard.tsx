// ✨ NEW: สร้างไฟล์และ Component ใหม่ทั้งหมด
import React from 'react';

// 💡 EXPLANATION: เรากำหนด Type ของ props ที่ Component นี้จะรับ
//                เพื่อให้ TypeScript ช่วยตรวจสอบความถูกต้อง
interface ApplicationData {
  examVenue: string | null;
  examRoom: string | null;
  seatNumber: string | null;
}

const ExamInfoCard = ({ application }: { application: ApplicationData }) => {
  return (
    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div className="flex items-center gap-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-500">
            <path d="M4.5 3.75a3 3 0 0 0-3 3v.5c0 .414.336.75.75.75h19.5a.75.75 0 0 0 .75-.75v-.5a3 3 0 0 0-3-3h-15Z" />
            <path fillRule="evenodd" d="M3 9.75v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V9.75a.75.75 0 0 0-1.5 0v4.69a.75.75 0 0 1-1.5 0v-1.94a.75.75 0 0 0-1.5 0v1.94a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 0-1.5 0v4.69a.75.75 0 0 1-1.5 0v-1.94a.75.75 0 0 0-1.5 0v1.94a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 0-1.5 0v4.69a.75.75 0 0 1-1.5 0v-1.94a.75.75 0 0 0-1.5 0v1.94a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 0-1.5 0Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">ข้อมูลการเข้าสอบของคุณ</h2>
          <p className="text-gray-600">กรุณาตรวจสอบและมาถึงสนามสอบก่อนเวลา</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
        <div>
          <p className="text-sm font-medium text-gray-500">สถานที่สอบ</p>
          <p className="text-lg font-bold text-indigo-600">{application.examVenue || 'รอการประกาศ'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">ห้องสอบ</p>
          <p className="text-lg font-bold text-indigo-600">{application.examRoom || 'รอการประกาศ'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">เลขที่นั่งสอบ</p>
          <p className="text-lg font-bold text-indigo-600">{application.seatNumber || 'รอการประกาศ'}</p>
        </div>
      </div>
    </div>
  );
};

export default ExamInfoCard;