"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";

const Alert = ({ message, type }: { message: string, type: 'success' | 'error' }) => {
    const styles = {
        success: "bg-green-100 border-green-400 text-green-700",
        error: "bg-red-100 border-red-400 text-red-700",
    };
    return (
        <div className={`border px-4 py-3 rounded-md ${styles[type]}`} role="alert">
            <p>{message}</p>
        </div>
    )
};

type RequiredDoc = {
    type: string;
    name: string;
    rejectionReason?: string | null;
}

export default function Phase2SubmissionPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();

    const [docsToSubmit, setDocsToSubmit] = useState<RequiredDoc[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndFilterDocs = async () => {
            try {
                const res = await fetch('/api/me');
                if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
                const application = await res.json();

                const allRequiredDocs: RequiredDoc[] = [
                    { type: 'PHASE2_CONFIRMATION', name: 'ใบยืนยันสิทธิ์รอบแรก' },
                    { type: 'PHASE2_PAYMENT_SLIP', name: 'แบบฟอร์มยืนยันการชำระเงิน' }
                ];

                const fillteredDocs = allRequiredDocs.filter(reqDoc => {
                    const submittedDoc = application.documents.find((d: any) => d.documentType === reqDoc.type);
                    return !submittedDoc || submittedDoc.status === 'REJECTED';
                });

                const docsWithReason = fillteredDocs.map(reqDoc => {
                    const submittedDoc = application.documents.find((d: any) => d.documentType === reqDoc.type);
                    return { ...reqDoc, rejectionReason: submittedDoc?.rejectionReason }
                });

                setDocsToSubmit(docsWithReason);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        if (sessionStatus === 'authenticated') {
            fetchAndFilterDocs();
        }
    }, [sessionStatus, router]);

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

        const allFilesSelected = docsToSubmit.every(doc => selectedFiles[doc.type]);
        if (!allFilesSelected) {
            setError("กรุณาแนบไฟล์ให้ครบทุกรายการที่แสดง");
            return;
        }

        setIsLoading(true);

        try {
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

            const uploadPromises = Object.entries(selectedFiles)
                .filter(([_, file]) => file)
                .map(([docType, file]) => uploadFile(file!, docType));

            await Promise.all(uploadPromises);

            setSuccess("ส่งเอกสารเรียบร้อยแล้ว! ระบบกำลังจะนำท่านกลับไปหน้าหลัก");
            setTimeout(() => { router.push('/dashboard'); }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (sessionStatus === 'loading' || isLoading) {
        return <main className="flex items-center justify-center h-screen"><Spinner size="lg" /></main>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>ส่งเอกสารยืนยันสิทธิ์สอบ (เฟส 2)</h1>
                <p className='text-gray-600 mb-8'>กรุณาดำเนินการตามขั้นตอนเพื่อรักษาสิทธิ์ในการเข้าสอบของคุณ</p>
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="mb-4 text-gray-700">
                                ขั้นตอนที่ 1: เตรียมเอกสาร
                            </h2>
                            <p className="mb-4 text-gray-700">
                                ดาวน์โหลด "แบบฟอร์มยืนยันการชำระเงิน" กรอกข้อมูลและแนบสลิปการชำระเงินให้เรียบร้อย จากนั้นจึงอัปโหลดกลับเข้ามาในขั้นตอนที่ 2
                            </p>
                            <div className="space-y-2">
                                {/* ลิงก์ดาวน์โหลดสำหรับเอกสารที่ 1 */}
                                <a
                                    href="/forms/confirmation_form.pdf"
                                    download="1_ใบยืนยันสิทธิ์-วมว.pdf"
                                    className="block text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                >
                                    🔗 ดาวน์โหลด (1) ใบยืนยันสิทธิ์รอบแรก
                                </a>
                                {/* ลิงก์ดาวน์โหลดสำหรับเอกสารที่ 2 */}
                                <a
                                    href="/forms/payment_confirmation_form.pdf"
                                    download="2_แบบฟอร์มยืนยันการชำระเงิน-วมว.pdf"
                                    className="block text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                >
                                    🔗 ดาวน์โหลด (2) แบบฟอร์มยืนยันการชำระเงิน
                                </a>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">
                                ขั้นตอนที่ 2: อัปโหลดเอกสาร (PDF เท่านั้น)
                            </h2>
                            {docsToSubmit.length > 0 ? (
                                <div className="space-y-6">
                                    {docsToSubmit.map(doc => (
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
                                    ))}
                                    <div>
                                        {error && <Alert message={error} type="error" />}
                                        <Button type="submit" isLoading={isLoading} className="mt-4">
                                            ยืนยันการส่งเอกสาร
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 text-green-800 rounded-md">
                                    <p>คุณได้ส่งเอกสารทั้งหมดเรียบร้อยแล้วและกำลังรอการตรวจสอบ</p>
                                </div>
                            )}

                        </div>
                    </form>
                )}
                {success && <Alert message={success} type="success" />}
            </div>
        </main>
    )
}