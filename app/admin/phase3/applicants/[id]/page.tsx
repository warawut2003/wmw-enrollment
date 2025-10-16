// app/admin/phase3/applicants/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';

// 1. กำหนด Type
interface DocumentData {
    id: string;
    fileName: string;
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
    prorityRank: number | null; // 💡 ใช้ Rank
    school: {
        name: string;
        province: string;
    };
    documents: DocumentData[];
}

// 2. 💡 รายการเอกสารเฟส 3 ที่เราต้องตรวจ
const requiredDocsConfig = [
    { type: 'PHASE3_CONSENT', name: 'หนังสือยืนยันสิทธิ์' },
    { type: 'PHASE3_CONTRACT', name: 'สัญญามอบตัว' },
    { type: 'PHASE3_ENROLLMENT', name: 'ใบมอบตัว' }
];

// 💡 NEW: [แก้ไข] ย้าย Component ออกมาข้างนอก
// และรับ props ที่จำเป็นทั้งหมด
const RenderStatusSpecificContent = ({
    application,
    phase3Documents,
    updatingDocId,
    viewingDocId,
    rejectionReasons,
    handleViewDocument,
    handleUpdateStatus,
    handleReasonChange
}: {
    application: ApplicationData;
    phase3Documents: DocumentData[];
    updatingDocId: string | null;
    viewingDocId: string | null;
    rejectionReasons: Record<string, string>;
    handleViewDocument: (docId: string) => void;
    handleUpdateStatus: (docId: string, status: 'APPROVED' | 'REJECTED') => void;
    handleReasonChange: (docId: string, reason: string) => void;
}) => {
    const status = application.applicationStatus;

    // 💡 [แก้ไข] เพิ่ม 'PENDING_APPROVAL' ในเงื่อนไข
    if (
        status === 'PENDING_APPROVAL' || // <-- เพิ่มสถานะนี้
        status === 'CONFIRMED' ||
        status === 'INCORRECT_DOCS' ||
        status === 'ENROLLED'
    ) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">ตรวจสอบเอกสารมอบตัว (เฟส 3)</h2>
                {status === 'ENROLLED' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                        ✅ นักเรียนคนนี้มอบตัวสำเร็จแล้ว
                    </div>
                )}
                <div className="space-y-8">
                    {requiredDocsConfig.map(reqDoc => {
                        const submittedDoc = phase3Documents.find(d => d.documentType === reqDoc.type);
                        const docId = submittedDoc?.id;
                        const currentStatus = submittedDoc ? submittedDoc.status : 'NOT_SUBMITTED';
                        const isUpdating = updatingDocId === docId;

                        return (
                            <div key={reqDoc.type} className="border-b pb-6 last:border-b-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">{reqDoc.name}</h3>
                                    <StatusBadge status={currentStatus} />
                                </div>
                                {currentStatus === 'NOT_SUBMITTED' ? (
                                    <p className="text-gray-500 italic">นักเรียนยังไม่ได้อัปโหลดเอกสารนี้</p>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm"><strong>ไฟล์:</strong> {submittedDoc!.fileName}</p>
                                        <button
                                            onClick={() => handleViewDocument(submittedDoc!.id)}
                                            disabled={viewingDocId === submittedDoc!.id}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50"
                                        >
                                            {viewingDocId === submittedDoc!.id ? 'กำลังโหลด...' : '🔗 ดูเอกสาร'}
                                        </button>

                                        {currentStatus === 'PENDING' && status !== 'ENROLLED' ? (
                                            <>
                                                <div>
                                                    <label htmlFor={`reason-${docId}`} className="block text-sm font-medium text-gray-700">เหตุผล (หากไม่ผ่าน):</label>
                                                    <input
                                                        type="text"
                                                        id={`reason-${docId}`}
                                                        value={rejectionReasons[docId!] || ''}
                                                        onChange={(e) => handleReasonChange(docId!, e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
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
                                            <>
                                                {currentStatus === 'APPROVED' && (
                                                    <div className="mt-2 p-3 bg-green-50 border-green-200 rounded-md text-sm text-green-700"><strong>สถานะ:</strong> อนุมัติแล้ว</div>
                                                )}
                                                {currentStatus === 'REJECTED' && (
                                                    <div className="mt-2 p-3 bg-red-50 border-red-200 rounded-md text-sm text-red-700">
                                                        <strong>เหตุผล:</strong> {submittedDoc!.rejectionReason || 'N/A'}
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
        );
    }

    // สถานะอื่นๆ ที่ไม่ต้องตรวจสอบเอกสาร
    let infoMessage = "";
    switch (status) {
        case 'AWAITING_PHASE3_DECISION':
            infoMessage = "รอนักเรียนตัดสินใจ (ยืนยัน/สละสิทธิ์)";
            break;
        case 'WAITING_LIST':
            infoMessage = "สถานะ: ตัวสำรอง (รอเรียกยืนยันสิทธิ์)";
            break;
        case 'WITHDRAWN':
            infoMessage = "นักเรียนได้สละสิทธิ์แล้ว";
            break;
        case 'NO_ACTION':
            infoMessage = "นักเรียนไม่ดำเนินการภายในเวลาที่กำหนด";
            break;
        default:
            infoMessage = `สถานะปัจจุบัน: ${status}`;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-gray-700">{infoMessage}</h2>
            <p className="text-gray-500 mt-2">ไม่มีเอกสารให้ตรวจสอบในสถานะนี้</p>
        </div>
    );
}


// --- Component หลัก ---
export default function ApplicantPhase3DetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [application, setApplication] = useState<ApplicationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingDocId, setViewingDocId] = useState<string | null>(null);
    const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    // 3. ฟังก์ชันดึงข้อมูล (เรียก API GET ของเฟส 3)
    const fetchApplicantData = async () => {
        if (!id) return;
        // 💡 ตั้งค่า isLoading ที่นี่ เพื่อให้ re-fetch โชว์ loading
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/phase3/applicants/${id}`);
            if (!res.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
            }
            const data: ApplicationData = await res.json();
            setApplication(data);

            const reasons: Record<string, string> = {};
            data.documents
                .filter(doc => doc.documentType.startsWith('PHASE3'))
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

    useEffect(() => {
        fetchApplicantData();
    }, [id]);

    // 4. ฟังก์ชัน "ดูเอกสาร"
    const handleViewDocument = async (documentId: string) => {
        setViewingDocId(documentId);
        try {
            const res = await fetch(`/api/documents/view?documentId=${documentId}`);
            if (!res.ok) throw new Error('Could not retrieve document');
            const data = await res.json();
            window.open(data.signedUrl, '_blank');
        } catch (err: any) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการเปิดเอกสาร');
        } finally {
            setViewingDocId(null);
        }
    };

    // 5. 💡 ฟังก์ชัน "อัปเดตสถานะ" (เรียก API PUT ของเฟส 3)
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
            const res = await fetch(`/api/admin/phase3/documents/${documentId}`, {
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

    // 6. ฟังก์ชันอัปเดต State เหตุผล
    const handleReasonChange = (documentId: string, reason: string) => {
        setRejectionReasons(prev => ({ ...prev, [documentId]: reason }));
    };

    // --- 7. ส่วน Render ---
    if (isLoading) {
        return <main className="flex items-center justify-center h-screen"><Spinner size='lg' /></main>;
    }
    if (error) {
        return <main className="flex items-center justify-center h-screen"><p className="text-red-500">{error}</p></main>;
    }
    if (!application) {
        return <main className="flex items-center justify-center h-screen"><p>ไม่พบข้อมูลผู้สมัคร</p></main>;
    }

    // กรองเอกสารเฟส 3
    const phase3Documents = application.documents.filter(d =>
        d.documentType.startsWith('PHASE3')
    );

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Link href="/admin/phase3/applicants" className="text-blue-600 hover:underline mb-4 block">
                &larr; กลับไปหน้ารายชื่อ (เฟส 3)
            </Link>

            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                ตรวจสอบ (เฟส 3): {application.title}{application.firstName} {application.lastName}
            </h1>

            {/* 9. แสดงข้อมูลนักเรียน */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">ข้อมูลผู้สมัคร</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong>โรงเรียน:</strong> {application.school.name}</p>
                    <p><strong>จังหวัด:</strong> {application.school.province}</p>
                    <p><strong>ลำดับที่:</strong> {application.prorityRank || '-'}</p>
                    <p><strong>สถานะ:</strong> <StatusBadge status={application.applicationStatus} /></p>
                </div>
            </div>

            {/* 💡 NEW: [แก้ไข] เรียก Component ที่ย้ายออกมา
                และส่ง props ที่จำเป็นทั้งหมดให้มัน */}
            <RenderStatusSpecificContent
                application={application}
                phase3Documents={phase3Documents}
                updatingDocId={updatingDocId}
                viewingDocId={viewingDocId}
                rejectionReasons={rejectionReasons}
                handleViewDocument={handleViewDocument}
                handleUpdateStatus={handleUpdateStatus}
                handleReasonChange={handleReasonChange}
            />

        </div>
    );
}