"use client";

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

// 💡 EXPLANATION: กำหนด Type ที่จำเป็นสำหรับ Component นี้เท่านั้น
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

const DocumentStatusList = ({ application, submissionPeriod }: Props) => {
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
      setViewingDocId(null);
    }
  };

  const requiredDocs = [
    { type: 'PHASE2_CONFIRMATION', name: 'ใบยืนยันสิทธิ์รอบแรก' },
    { type: 'PHASE2_PAYMENT_SLIP', name: 'แบบฟอร์มยืนยันการชำระเงิน' }
  ];

  const now = new Date();
  const startDate = submissionPeriod.start ? new Date(submissionPeriod.start) : null;
  const endDate = submissionPeriod.end ? new Date(submissionPeriod.end) : null;

  const isBeforePeriod = startDate && now < startDate;
  const isAfterPeriod = endDate && now > endDate;
  const isWithinPeriod = !isBeforePeriod && !isAfterPeriod;

  const isPeriodDefined = startDate && endDate;

  const phase2Docs = documents.filter(d => d.documentType.startsWith('PHASE2'));
  const isRejected = phase2Docs.some(d => d.status === 'REJECTED');
  const isFullyApproved = phase2Docs.length === 2 && phase2Docs.every(d => d.status === 'APPROVED');

  const canUpload = (phase2Docs.length < 2 || isRejected) && isWithinPeriod && isPeriodDefined;

  const getOverallStatusText = () => {
    const phase3Statuses = [
      'AWAITING_PHASE3_DECISION',
      'CONFIRMED',
      'WITHDRAWN',
      'WAITING_LIST',
      'ENROLLED'
    ];

    if(phase3Statuses.includes(application.applicationStatus)){
      return 'เอกสารยืนยันสิทธิ์สอบ (เฟส 2) ของคุณผ่านการตรวจสอบเรียบร้อยแล้ว';
    }

    if(!isPeriodDefined){
      return 'ยังไม่เปิดให้ดำเนินการในส่วนนี้ โปรดรอการประกาศจากผู้ดูแลระบบ'
    }

    if (isBeforePeriod) {
        return `จะเปิดให้ส่งเอกสารในวันที่ ${startDate?.toLocaleString('th-TH')}`;
    }
    if (isAfterPeriod && phase2Docs.length === 0) {
        return 'คุณไม่ได้ดำเนินการส่งเอกสารภายในเวลาที่กำหนด';
    }

    if (isFullyApproved) return 'เอกสารของคุณผ่านการตรวจสอบแล้ว รอการประกาศผลสอบ';
    if (isRejected) return 'เอกสารบางรายการไม่ถูกต้อง กรุณาตรวจสอบและอัปโหลดใหม่';
    if (application.applicationStatus === 'PENDING_APPROVAL') return 'เอกสารของคุณอยู่ระหว่างการตรวจสอบโดยเจ้าหน้าที่';

    return 'กรุณาดำเนินการอัปโหลดเอกสารให้ครบถ้วนเพื่อยืนยันสิทธิ์สอบ';
  };

  return (
    <div className='md:col-span-2 bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4 border-b pb-2'>สถานะการดำเนินการ (เฟส 2)</h2>

      
      <div className={`p-4 mb-4 border-l-4 rounded-r-lg ${
          !isPeriodDefined ? 'bg-gray-50 border-gray-400 text-gray-700' :
          isAfterPeriod && phase2Docs.length === 0 ? 'bg-red-50 border-red-500 text-red-800' :
          isFullyApproved ? 'bg-green-50 border-green-500 text-green-800' :
          isBeforePeriod ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
          'bg-blue-50 border-blue-500 text-blue-800'
      }`}>
        <p className="font-bold">สรุปสถานะ:</p>
        <p>{getOverallStatusText()}</p>
      </div>

      <div className='space-y-4'>
        {requiredDocs.map(reqDoc => {
          const submittedDoc = documents.find(d => d.documentType === reqDoc.type);
          return (
            <div key={reqDoc.type}>
              <div className='flex justify-between items-center'>
                <p className='font-semibold'>{reqDoc.name}</p>
                <StatusBadge status={submittedDoc?.status || 'AWAITING_PHASE2_DOCS'} />
              </div>

              {submittedDoc && (
                    <div className="mt-2 text-right">
                        <button
                        onClick={() => handleViewDocument(submittedDoc.id)}
                        disabled={viewingDocId === submittedDoc.id}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50 disabled:cursor-wait"
                        >
                        {viewingDocId === submittedDoc.id ? 'กำลังโหลด...' : 'ดูเอกสาร'}
                        </button>
                    </div>
                )}
              
               {submittedDoc?.status === 'REJECTED' && (
                    <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700'>
                        <strong>เหตุผล:</strong> {submittedDoc.rejectionReason || 'ไม่มีข้อมูล'}
                    </div>
                )}
            </div>
          );
        })}
      </div>


     {canUpload && (
        <div className='mt-6 border-t pt-4'>
          <Link href='/documents/phase2-submission'
            className='block w-full text-center bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors'>
            {isRejected ? 'แก้ไขและส่งเอกสาร' : 'ส่งเอกสารยืนยันสิทธิ์สอบ'}
          </Link>
        </div>
      )}

      {endDate && <p className="text-sm text-center text-gray-500 mt-2">หมดเขตดำเนินการ: {endDate.toLocaleString('th-TH')}</p>}

    </div>

  );
};

export default DocumentStatusList;