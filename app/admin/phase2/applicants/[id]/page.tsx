// app/admin/phase2/applicants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
// 1. Import StatusBadge ตัวจริงกลับเข้ามา
import StatusBadge from '@/components/ui/StatusBadge'; 

// 1. กำหนด Type ของข้อมูลที่เราจะดึงมา (จาก API GET)
interface DocumentData {
    id: string;
    fileName: string;
    documentType: 'PHASE2_PAYMENT_SLIP' | 'PHASE2_CONFIRMATION' | string; 
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
    gpaTotal: number | null;
    gpaMath: number | null;
    gpaScience: number | null;
    school: {
        name: string;
        province: string;
    };
    documents: DocumentData[];
}

// 2. รายการเอกสารเฟส 2 ที่เราต้องตรวจ
const requiredDocsConfig = [
    { type: 'PHASE2_CONFIRMATION', name: 'ใบยืนยันสิทธิ์รอบแรก' },
    { type: 'PHASE2_PAYMENT_SLIP', name: 'แบบฟอร์มยืนยันการชำระเงิน' }
];

// ---------------------------------
// 3. โค้ด Component หลัก
// ---------------------------------
export default function ApplicantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingDocId, setViewingDocId] = useState<string | null>(null);
    const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    // ฟังก์ชันสำหรับดึงข้อมูลนักเรียน (เรียก API GET)
    const fetchApplicantData = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/admin/phase2/applicants/${id}`);
            if (!res.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
            }
            const data: ApplicationData = await res.json();
            setApplication(data);

            // ตั้งค่าเหตุผล Reject เริ่มต้น (ถ้ามี)
            const reasons: Record<string, string> = {};
            data.documents
                .filter(doc => doc.documentType.startsWith('PHASE2'))
                .forEach((doc) => {
                    reasons[doc.id] = doc.rejectionReason || '';
                });
            setRejectionReasons(reasons);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // สั่งให้ดึงข้อมูลเมื่อ Component โหลด
    useEffect(() => {
        fetchApplicantData();
    }, [id]);

    // ฟังก์ชัน "ดูเอกสาร"
    const handleViewDocument = async (documentId: string) => {
        setViewingDocId(documentId);
        try {
            const res = await fetch(`/api/documents/view?documentId=${documentId}`);
            if (!res.ok) {
                throw new Error('Could not retrieve document');
            }
            const data = await res.json();
            window.open(data.signedUrl, '_blank'); 
        } catch (err: any) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการเปิดเอกสาร');
        } finally {
            setViewingDocId(null);
        }
    };

    // ฟังก์ชัน "อัปเดตสถานะ" (เรียก API PUT)
    const handleUpdateStatus = async (
        documentId: string,
        newStatus: 'APPROVED' | 'REJECTED'
    ) => {
        setUpdatingDocId(documentId);
        const reason = rejectionReasons[documentId] || null; 

        if (newStatus === 'REJECTED' && (!reason || reason.trim() === '')) {
            alert('กรุณากรอกเหตุผลที่เอกสารไม่ผ่าน');
            setUpdatingDocId(null);
            return;
        }

        try {
            const res = await fetch(`/api/admin/documents/${documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    rejectionReason: reason,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'ไม่สามารถอัปเดตสถานะได้');
            }

            alert('อัปเดตสถานะเรียบร้อย');
            await fetchApplicantData(); // ดึงข้อมูลใหม่

        } catch (err: any) {
            console.error(err);
            alert(`เกิดข้อผิดพลาด: ${err.message}`);
        } finally {
            setUpdatingDocId(null); 
        }
    };

    // ฟังก์ชันสำหรับอัปเดต State ของ rejection reason
    const handleReasonChange = (documentId: string, reason: string) => {
        setRejectionReasons(prev => ({
            ...prev,
            [documentId]: reason,
        }));
    };

    // --- ส่วน Render (แสดงผล) ---
    if (isLoading) {
        return <main className="flex items-center justify-center h-screen"><Spinner size='lg' /></main>;
    }

    if (error) {
        return <main className="flex items-center justify-center h-screen"><p className="text-red-500">{error}</p></main>;
    }

    if (!application) {
        return <main className="flex items-center justify-center h-screen"><p>ไม่พบข้อมูลผู้สมัคร</p></main>;
    }

    const phase2Documents = application.documents.filter(d =>
        d.documentType.startsWith('PHASE2')
    );

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Link href="/admin/phase2/applicants" className="text-blue-600 hover:underline mb-4 block">
                &larr; กลับไปหน้ารายชื่อ
            </Link>

            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                ตรวจสอบเอกสาร: {application.title}{application.firstName} {application.lastName}
            </h1>

            {/* แสดงข้อมูลนักเรียน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">ข้อมูลผู้สมัคร</h2>
                    <div className="space-y-3 text-sm">
                        <p><strong>โรงเรียน:</strong> {application.school.name} ({application.school.province})</p>
                        <p><strong>GPAX:</strong> {application.gpaTotal?.toFixed(2) || '-'}</p>
                        <p><strong>GPA Math:</strong> {application.gpaMath?.toFixed(2) || '-'}</p>
                        <p><strong>GPA Sci:</strong> {application.gpaScience?.toFixed(2) || '-'}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">สถานะและการสอบ</h2>
                    <div className="space-y-3 text-sm">
                        <p><strong>สถานะปัจจุบัน:</strong> <StatusBadge status={application.applicationStatus} /></p>
                        <p><strong>สนามสอบ:</strong> {application.examVenue || '-'}</p>
                        <p><strong>ห้องสอบ:</strong> {application.examRoom || '-'}</p>
                        <p><strong>เลขที่นั่ง:</strong> {application.seatNumber || '-'}</p>
                    </div>
                </div>
            </div>

            {/* ส่วนสำหรับตรวจสอบเอกสาร */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">เอกสารยืนยันสิทธิ์ (เฟส 2)</h2>
                <div className="space-y-8">

                    {requiredDocsConfig.map(reqDoc => {
                        const submittedDoc = phase2Documents.find(d => d.documentType === reqDoc.type);
                        const docId = submittedDoc?.id;
                        
                        // Logic ที่แก้ไขแล้ว: ถ้าไม่มี doc ให้ใช้ 'NOT_SUBMITTED'
                        const currentStatus = submittedDoc 
                            ? submittedDoc.status 
                            : 'NOT_SUBMITTED';

                        const isUpdating = updatingDocId === docId; 

                        return (
                            <div key={reqDoc.type} className="border-b pb-6 last:border-b-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">{reqDoc.name}</h3>
                                    <StatusBadge status={currentStatus} />
                                </div>

                                {currentStatus === 'NOT_SUBMITTED' ? (
                                    // 1. กรณีนักเรียน "ยังไม่ส่ง"
                                    <p className="text-gray-500 italic">นักเรียนยังไม่ได้อัปโหลดเอกสารนี้</p>
                                ) : (
                                    // 2. กรณีนักเรียน "ส่งแล้ว" (ไม่ว่าสถานะจะเป็นอะไร)
                                    <div className="space-y-4">
                                        <p className="text-sm"><strong>ชื่อไฟล์:</strong> {submittedDoc!.fileName}</p>

                                        <button
                                            onClick={() => handleViewDocument(submittedDoc!.id)}
                                            disabled={viewingDocId === submittedDoc!.id}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50"
                                        >
                                            {viewingDocId === submittedDoc!.id ? 'กำลังโหลด...' : '🔗 ดูเอกสารที่แนบมา'}
                                        </button>

                                        {currentStatus === 'PENDING' ? (
                                            // 2a. ถ้า "รอตรวจสอบ" -> แสดงปุ่ม
                                            <>
                                                <div>
                                                    <label htmlFor={`reason-${docId}`} className="block text-sm font-medium text-gray-700">
                                                        เหตุผล (หากเอกสารไม่ผ่าน):
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`reason-${docId}`}
                                                        value={rejectionReasons[docId!] || ''}
                                                        onChange={(e) => handleReasonChange(docId!, e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="เช่น สลิปไม่ชัดเจน, เอกสารไม่ครบถ้วน"
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleUpdateStatus(docId!, 'APPROVED')}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                                                    >
                                                        {isUpdating ? '...' : '✅ เอกสารผ่าน'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(docId!, 'REJECTED')}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                                                    >
                                                        {isUpdating ? '...' : '❌ เอกสารไม่ผ่าน'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            // 2b. ถ้า "ตรวจแล้ว" (APPROVED หรือ REJECTED) -> แสดงผลลัพธ์
                                            <>
                                                {currentStatus === 'APPROVED' && (
                                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                                                        <strong>สถานะ:</strong> อนุมัติเรียบร้อยแล้ว
                                                    </div>
                                                )}
                                                {currentStatus === 'REJECTED' && (
                                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                                        <strong>เหตุผลที่ไม่ผ่าน:</strong> {submittedDoc!.rejectionReason || 'ไม่มีข้อมูล'}
                                                        <p className='mt-1 text-xs italic'>*สถานะ: ปฏิเสธ (รอนักเรียนอัปโหลดใหม่)</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}