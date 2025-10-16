// ✨ NEW: สร้างไฟล์และ Component ใหม่ทั้งหมด
"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

interface DocumentData {
    id: string;
    documentType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
}

interface RequiredDoc {
    type: string;
    name: string;
    rejectionReason?: string | null;
    requiredFor: 'ALL' | 'CONFIRMED'; // ระบุว่าจำเป็นสำหรับเงื่อนไขไหน
}

interface ApplicationData {
    applicationStatus: string;
    documents: DocumentData[];
}


export default function Phase3SubmissionPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();

    const [application, setApplication] = useState<ApplicationData | null>(null);

    const [decision, setDecision] = useState<'CONFIRMED' | 'WITHDRAWN' | ''>('');
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            const fetchSubmittedDocs = async () => {
                try {
                    const res = await fetch('/api/me');
                    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
                    const appData = await res.json();
                    setApplication(appData);

                    
                    if (appData.applicationStatus !== 'AWAITING_PHASE3_DECISION') {
                        setDecision('CONFIRMED');
                    }
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSubmittedDocs();
        } else if (sessionStatus === 'unauthenticated') {
            router.replace('/sign-in');
        }
    }, [sessionStatus, router]);

    const allPhase3Docs: RequiredDoc[] = [
        { type: 'PHASE3_CONSENT', name: '1. หนังสือยืนยันสิทธิ์', requiredFor: 'ALL' },
        { type: 'PHASE3_CONTRACT', name: '2. สัญญามอบตัว', requiredFor: 'CONFIRMED' },
        { type: 'PHASE3_ENROLLMENT', name: '3. ใบมอบตัว', requiredFor: 'CONFIRMED' },
    ];

    const getDocsToDisplay = () => {
        if (!application) return [];

        return allPhase3Docs
            .filter(reqDoc => {
                if (decision === 'CONFIRMED') return true;
                if (decision === 'WITHDRAWN') return reqDoc.requiredFor === 'ALL';
                return false;
            })
            .filter(reqDoc => {
                const submitted = application.documents.find(d => d.documentType === reqDoc.type);
                return !submitted || submitted.status === 'REJECTED';
            })
            .map(reqDoc => {
                // 🔧 MODIFIED: เปลี่ยนมาใช้ `application.documents`
                const submitted = application.documents.find(d => d.documentType === reqDoc.type);
                return { ...reqDoc, rejectionReason: submitted?.rejectionReason };
            });
    };

    const docsToDisplay = getDocsToDisplay();

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const docType = e.target.name;
        setSelectedFiles(prev => ({
            ...prev,
            [docType]: file || null,
        }));
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!decision) {
            return setError('กรุณาเลือก "ยืนยันสิทธิ์" หรือ "สละสิทธิ์"');
        }

        const requiredFilesForDecision = getDocsToDisplay();
        const allFilesSelected = requiredFilesForDecision.every(doc => selectedFiles[doc.type]);
        if (!allFilesSelected) {
            return setError('กรุณาแนบไฟล์ให้ครบทุกรายการที่แสดง');
        }

        setIsLoading(true);

        try {
            
            const uploadPromises = Object.entries(selectedFiles)
                .filter(([_, file]) => file)
                .map(([docType, file]) => uploadFile(file!, docType));
            
            await Promise.all(uploadPromises);

            if (application?.applicationStatus === 'AWAITING_PHASE3_DECISION') {
                const decisionRes = await fetch('/api/applicants/decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision }),
                });
                if (!decisionRes.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึกการตัดสินใจ');
            }
            
            setSuccess("ดำเนินการเรียบร้อยแล้ว! ระบบกำลังจะนำท่านกลับไปหน้าหลัก");
            setTimeout(() => { router.push('/dashboard'); }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadFile = async (file: File, documentType: string) => {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('documentType', documentType);

        const res = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `อัปโหลด ${documentType} ไม่สำเร็จ`);
        }
    };

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {!success ? (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">ยืนยันสิทธิ์การเข้าศึกษา (เฟส 3)</h1>
                            <p className="mt-2 text-gray-600">กรุณาดำเนินการตามขั้นตอนให้ครบถ้วนภายในเวลาที่กำหนด</p>
                        </div>

                        {/* ✨ NEW: เพิ่มส่วนดาวน์โหลดเอกสาร (ขั้นตอนที่ 1) */}
                        <div className="border-t pt-6 space-y-2">
                            <h2 className="text-lg font-semibold text-gray-800">ขั้นตอนที่ 1: เตรียมเอกสาร</h2>
                            <p className="text-sm text-gray-600 pb-2">ดาวน์โหลดแบบฟอร์มเอกสาร และกรอกข้อมูลให้เรียบร้อยเพื่อใช้ในขั้นตอนต่อไป</p>
                            <a href="/forms/phase3_consent.pdf" download="หนังสือยืนยันสิทธิ์.pdf" className="block text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                                🔗 ดาวน์โหลด (1) หนังสือยืนยันสิทธิ์
                            </a>
                            <a href="/forms/phase3_contract.pdf" download="สัญญามอบตัว.pdf" className="block text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                                🔗 ดาวน์โหลด (2) สัญญามอบตัว
                            </a>
                            <a href="/forms/phase3_enrollment.pdf" download="ใบมอบตัว.pdf" className="block text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                                🔗 ดาวน์โหลด (3) ใบมอบตัว
                            </a>
                        </div>

                        {application?.applicationStatus === 'AWAITING_PHASE3_DECISION' && (
                            <div className="border-t pt-6 space-y-2">
                                <label className="block text-lg font-semibold text-gray-800">ขั้นตอนที่ 2: โปรดเลือกการดำเนินการของคุณ</label>
                                <div className="flex gap-6 items-center pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="decision" value="CONFIRMED" className="h-4 w-4" onChange={(e) => setDecision(e.target.value as any)} /> ยืนยันสิทธิ์
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="decision" value="WITHDRAWN" className="h-4 w-4" onChange={(e) => setDecision(e.target.value as any)} /> สละสิทธิ์
                                    </label>
                                </div>
                            </div>
                        )}

                        {decision && (
                            <div className="space-y-6 border-t pt-6">
                                <h2 className="text-lg font-semibold text-gray-800">ขั้นตอนที่ 3: อัปโหลดเอกสารที่เกี่ยวข้อง (PDF เท่านั้น)</h2>
                                {docsToDisplay.length > 0 ? (
                                    docsToDisplay.map(doc => (
                                        <div key={doc.type}>
                                            {doc.rejectionReason && (
                                                <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                                    <strong>เอกสารนี้ถูกปฏิเสธ:</strong> {doc.rejectionReason}
                                                </div>
                                            )}
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{doc.name}</label>
                                            <div className="flex items-center gap-4">
                                                <label
                                                    htmlFor={doc.type}
                                                    className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <span>
                                                        {selectedFiles[doc.type] ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์ PDF'}
                                                    </span>
                                                </label>
                                                <input
                                                    id={doc.type}
                                                    name={doc.type}
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                {selectedFiles[doc.type] && (
                                                    <p className="text-sm text-gray-600 truncate max-w-xs">
                                                        {selectedFiles[doc.type]?.name}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedFiles[doc.type] && <p className="text-xs text-gray-500 mt-1">ไฟล์ที่เลือก: {selectedFiles[doc.type]?.name}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 bg-green-50 text-green-800 rounded-md">
                                        <p>คุณได้ส่งเอกสารที่จำเป็นสำหรับ "{decision === 'CONFIRMED' ? 'การยืนยันสิทธิ์' : 'การสละสิทธิ์'}" ครบถ้วนแล้ว</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <Alert message={error} type="error" />}

                        <div className="border-t pt-6">
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                disabled={!decision || docsToDisplay.length === 0}
                            >
                                ยืนยันการดำเนินการ
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Alert message={success} type="success" />
                )}
            </div>
        </main>
    );
}