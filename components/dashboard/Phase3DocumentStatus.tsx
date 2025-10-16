// ✨ NEW: สร้างไฟล์และ Component ใหม่ทั้งหมด
"use client";

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

interface DocumentData {
  id: string;
  documentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
}

interface ApplicationData {
  applicationStatus: string;
  documents: DocumentData[];
}

interface SubmissionPeriod {
  start: string | null;
  end: string | null;
}

interface Props {
  application: ApplicationData;
  submissionPeriod: SubmissionPeriod;
}


export default function Phase3DocumentStatus({ application, submissionPeriod }: Props) {
  const { documents } = application;
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const handleViewDocument = async (documentId: string) => {
    setViewingDocId(documentId);
    try {
      const res = await fetch(`/api/documents/view?documentId=${documentId}`);
      if (!res.ok) {
        throw new Error('Could not retrieve document');
      }
      const data = await res.json();
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเปิดเอกสาร');
    } finally {
      setViewingDocId(null); // หยุด Loading state
    }
  };

  // 🔧 MODIFIED: เปลี่ยนรายการเอกสารให้เป็นของเฟส 3
  const requiredDocs = [
    { type: 'PHASE3_CONSENT', name: 'หนังสือยืนยันสิทธิ์' },
    { type: 'PHASE3_CONTRACT', name: 'สัญญามอบตัว' },
    { type: 'PHASE3_ENROLLMENT', name: 'ใบมอบตัว' },
  ];

  const now = new Date();
  const startDate = submissionPeriod.start ? new Date(submissionPeriod.start) : null;
  const endDate = submissionPeriod.end ? new Date(submissionPeriod.end) : null;
  const isWithinPeriod = startDate && endDate && now >= startDate && now <= endDate;

  const phase3Docs = documents.filter(d => d.documentType.startsWith('PHASE3'));
  const isRejected = phase3Docs.some(d => d.status === 'REJECTED');

  // 💡 EXPLANATION: ผู้ใช้จะสามารถแก้ไขเอกสารได้ ถ้ามีบางชิ้นถูกปฏิเสธ และยังอยู่ในช่วงเวลาที่กำหนด
  const canUpload = isRejected && isWithinPeriod;

  // 🔧 MODIFIED: ปรับปรุงข้อความสรุปสถานะให้เป็นของเฟส 3
  const getOverallStatusText = () => {
    if (application.applicationStatus === 'INCORRECT_DOCS' || isRejected) {
      return 'เอกสารบางรายการไม่ถูกต้อง กรุณาตรวจสอบและอัปโหลดใหม่';
    }
    if (application.applicationStatus === 'PENDING_APPROVAL') {
      return 'เอกสารมอบตัวของคุณอยู่ระหว่างการตรวจสอบโดยเจ้าหน้าที่';
    }
    if (application.applicationStatus === 'ENROLLED') {
        return 'เอกสารทั้งหมดผ่านการตรวจสอบเรียบร้อยแล้ว การมอบตัวเสร็จสมบูรณ์';
    }
    // สถานะ CONFIRMED
    return 'ระบบได้รับเอกสารมอบตัวของคุณแล้ว และจะเริ่มตรวจสอบในลำดับถัดไป';
  };

  return (
    <div className='md:col-span-2 bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4 border-b pb-2'>สถานะการดำเนินการ (เฟส 3 - มอบตัว)</h2>
      
      <div className={`p-4 mb-4 border-l-4 rounded-r-lg bg-blue-50 border-blue-500 text-blue-800`}>
        <p className="font-bold">สรุปสถานะ:</p>
        <p>{getOverallStatusText()}</p>
      </div>

      <div className='space-y-4'>
        {requiredDocs.map(reqDoc => {
          const submittedDoc = documents.find(d => d.documentType === reqDoc.type);
          return (
            <div key={reqDoc.type} className="p-3 border rounded-md">
              <div className='flex justify-between items-center'>
                <p className='font-semibold'>{reqDoc.name}</p>
                {submittedDoc && <StatusBadge status={submittedDoc.status} />}
              </div>
              {submittedDoc && (
                <>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => handleViewDocument(submittedDoc.id)}
                      disabled={viewingDocId === submittedDoc.id}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50 disabled:cursor-wait"
                    >
                      {viewingDocId === submittedDoc.id ? 'กำลังโหลด...' : 'ดูเอกสาร'}
                    </button>
                  </div>

                  {submittedDoc.status === 'REJECTED' && (
                    <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700'>
                      <strong>เหตุผล:</strong> {submittedDoc.rejectionReason || 'ไม่มีข้อมูล'}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {canUpload && (
        <div className='mt-6 border-t pt-4'>
          <Link href='/documents/phase3-submission'
            className='block w-full text-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors'>
            แก้ไขและส่งเอกสาร
          </Link>
        </div>
      )}
    </div>
  );
};