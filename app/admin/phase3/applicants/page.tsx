// app/admin/phase3/applicants/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";

type Applicant = {
    id: string;
    rank: number | null; // 💡 เพิ่ม rank
    name: string;
    schoolName: string;
    status: string;
};

type ApiResponse = {
    data: Applicant[];
    error: "NO_ACTIVE_YEAR" | null;
};

export default function AdminPhase3ApplicantsPage() {

    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [apiError, setApiError] = useState<"NO_ACTIVE_YEAR" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Debounce Effect
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);


    // Data Fetching Effect
    useEffect(() => {
        const fetchApplicants = async () => {
            setIsLoading(true);
            setApiError(null);

            const params = new URLSearchParams();
            params.append('search', debouncedSearchTerm);
            params.append('status', filterStatus);

            try {
                // 💡 1. เรียก API ของเฟส 3 ที่เราเพิ่งสร้าง
                const res = await fetch(
                    `/api/admin/phase3/applicants?${params.toString()}`,
                    { cache: "no-store" }
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch applicants data");
                }

                const { data, error }: ApiResponse = await res.json();

                if (error) {
                    setApiError(error);
                    setApplicants([]);
                } else {
                    setApplicants(data);
                }
            } catch (err) {
                console.error(err);
                setApiError(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApplicants();
    }, [debouncedSearchTerm, filterStatus]);


    return (
        <div className="container mx-auto p-6">

            {/* 💡 2. [สำคัญ] ส่วนหัวพร้อมปุ่ม Import */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    ตรวจสอบผู้สมัคร (เฟส 3)
                </h1>

                {/* 💡 นี่คือปุ่มที่คุณขอครับ */}
                <Link
                    href="/admin/phase3/import-results"
                    className="mt-3 md:mt-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    + Import ผลการคัดเลือก (Excel)
                </Link>
            </div>

            {/* 3. UI สำหรับค้นหาและกรอง (เฟส 3) */}
            <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                        ค้นหา (ชื่อ, นามสกุล, เลข ปชช.):
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="พิมพ์เพื่อค้นหา..."
                    />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        กรองตามสถานะ:
                    </label>
                    <select
                        id="status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="ALL">สถานะทั้งหมด (80 คน)</option>
                        <option value="AWAITING_PHASE3_DECISION">ตัวจริง (รอตัดสินใจ)</option>
                        <option value="WAITING_LIST">ตัวสำรอง (รอเรียก)</option>
                        <option value="CONFIRMED">ยืนยันสิทธิ์แล้ว</option>
                        <option value="WITHDRAWN">สละสิทธิ์</option>
                        <option value="ENROLLED">มอบตัวสำเร็จ</option>
                        <option value="NO_ACTION">ไม่ดำเนินการ</option>
                    </select>
                </div>
            </div>

            {apiError === "NO_ACTIVE_YEAR" && (
                <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center text-yellow-800 shadow-sm">
                    {/* ... (เหมือนเดิม) ... */}
                </div>
            )}

            {/* 4. ตารางเฟส 3 */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* 💡 5. แก้ไข Header ตาราง */}
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                                ลำดับที่
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                                ชื่อ-นามสกุล
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                                โรงเรียน
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                                สถานะ
                            </th>
                            <th className="px-4 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>

                    {!isLoading && (
                        <tbody className="divide-y divide-gray-200">
                            {applicants.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50">
                                    {/* 💡 6. แก้ไข Body ตาราง */}
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                        {app.rank}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                        {app.name}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                        {app.schoolName}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge status={app.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {/* 💡 7. สร้าง Link ไปยังหน้ารายละเอียดเฟส 3 */}
                                        <Link
                                            href={`/admin/phase3/applicants/${app.id}`}
                                            className="font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            ดูรายละเอียด
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>

                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <Spinner size="lg" />
                    </div>
                )}

            </div>

            {!isLoading && applicants.length === 0 && apiError !== "NO_ACTIVE_YEAR" && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                    {debouncedSearchTerm || filterStatus !== 'ALL'
                        ? 'ไม่พบข้อมูลผู้สมัครที่ตรงกับการค้นหา/กรอง'
                        : 'ไม่พบข้อมูลนักเรียน (เฟส 3) ในระบบ'}
                </div>
            )}
        </div>
    );
}