// app/admin/phase2/applicants/page.tsx
"use client"; // 👈 1. เปลี่ยนเป็น Client Component

import { useState, useEffect } from "react"; // 👈 2. Import useState, useEffect
import Link from "next/link";
import Spinner from "@/components/ui/Spinner"; // สมมติว่าคุณมี Spinner
import StatusBadge from "@/components/ui/StatusBadge"; // 💡 Import StatusBadge

// (Type และ statusDisplay เหมือนเดิม)
type Applicant = {
  id: string;
  name: string;
  schoolName: string;
  examVenue: string | null;
  examRoom: string | null;
  seatNumber: string | null;
  status: string;
};

type ApiResponse = {
  data: Applicant[];
  error: "NO_ACTIVE_YEAR" | null;
};

// 4. เปลี่ยนเป็น Component ธรรมดา (ลบ async)
export default function AdminPhase2ApplicantsPage() {

  // 5. 💡 [ใหม่] สร้าง States สำหรับเก็บข้อมูลและ UI
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [apiError, setApiError] = useState<"NO_ACTIVE_YEAR" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับการกรอง
  const [filterStatus, setFilterStatus] = useState("ALL"); // ค่าเริ่มต้น 'ALL'
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // State สำหรับ Debounce

  // 6. 💡 [ใหม่] Debounce Effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // รอ 0.3 วินาที

    return () => {
      clearTimeout(timerId); // ล้าง timer ถ้าพิมพ์ใหม่
    };
  }, [searchTerm]);


  // 7. 💡 [ใหม่] Data Fetching Effect
  useEffect(() => {

    // 7.1 สร้างฟังก์ชัน fetch ภายใน
    const fetchApplicants = async () => {
      setIsLoading(true);
      setApiError(null);

      // 7.2 สร้าง URLSearchParams
      const params = new URLSearchParams();
      params.append('search', debouncedSearchTerm); // ใช้ค่าที่ผ่านการ debounce
      params.append('status', filterStatus);

      try {
        const res = await fetch(
          `/api/admin/phase2/applicants?${params.toString()}`, // 💡 ส่ง params ไปใน URL
          {
            cache: "no-store",
          }
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
        setApiError(null); // หรือตั้งเป็น error ทั่วไป
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants(); // 7.3 เรียกใช้งานฟังก์ชัน

  }, [debouncedSearchTerm, filterStatus]); // 7.4 Dependencies


  return (
    <div className="container mx-auto p-6">

      {/* 💡 [ใหม่] เพิ่มส่วนหัวที่มีปุ่ม */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ตรวจสอบผู้สมัคร (เฟส 2)
        </h1>

        {/* 💡 [ใหม่] เพิ่มลิงก์ไปยังหน้า Import ที่นั่งสอบ */}
        <Link
          href="/admin/phase2/import-seating"
          className="mt-3 md:mt-0 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Import ข้อมูลที่นั่งสอบ (Excel)
        </Link>
      </div>
      {/* จบส่วนหัวที่แก้ไข */}


      {/* 9. 💡 UI สำหรับค้นหาและกรอง */}
      <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            ค้นหา (ชื่อ, นามสกุล, เลข ปชช., โรงเรียน):
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
            กรองตามสถานะเอกสาร:
          </label>
          <select
            id="status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="AWAITING_PHASE2_DOCS">ไม่ดำเนินการ</option>
            <option value="PENDING_APPROVAL">รอตรวจสอบ</option>
            <option value="INCORRECT_DOCS">เอกสารไม่ถูกต้อง</option>
            <option value="ELIGIBLE_FOR_EXAM">มีสิทธิ์สอบ</option>
          </select>
        </div>
      </div>
      {/* จบส่วน UI ใหม่ */}


      {apiError === "NO_ACTIVE_YEAR" && (
        // (ส่วนนี้เหมือนเดิม)
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center text-yellow-800 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">ยังไม่มีโครงการที่เปิดใช้งาน</h2>
          <p>
            ไม่พบข้อมูลปีการศึกษา (โครงการ) ที่กำลังเปิดรับสมัคร
          </p>
          <p className="mt-2">
            กรุณาไปที่หน้าตั้งค่าระบบเพื่อ
            <Link
              href="/admin/academic-years/create"
              className="font-bold underline hover:text-yellow-900 mx-1.5"
            >
              เปิดใช้งานโครงการ
            </Link>
            ก่อน
          </p>
        </div>
      )}

      {/* 10. ตาราง */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                ชื่อ-นามสกุล
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                โรงเรียน
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                ห้องสอบ
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                เลขที่นั่งสอบ
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-900">
                สถานะเอกสาร
              </th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          {/* 11. 💡 [ใหม่] แสดง Spinner ขณะโหลดข้อมูลในตาราง */}
          {!isLoading && (
            <tbody className="divide-y divide-gray-200">
              {applicants.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {app.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {app.schoolName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {app.examRoom || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {app.seatNumber || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {/* 💡 ใช้ StatusBadge ที่ Import มา */}
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/phase2/applicants/${app.id}`}
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

        {/* 12. 💡 [ใหม่] แสดง Spinner กลางตารางขณะโหลด */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        )}

      </div>

      {/* 13. กรณีไม่มีข้อมูล (แก้ไข Logic เล็กน้อย) */}
      {!isLoading && applicants.length === 0 && apiError !== "NO_ACTIVE_YEAR" && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {debouncedSearchTerm || filterStatus !== 'ALL'
            ? 'ไม่พบข้อมูลผู้สมัครที่ตรงกับการค้นหา/กรอง'
            : 'ไม่พบข้อมูลผู้สมัครในระบบ (สำหรับโครงการที่เปิดใช้งานอยู่)'}
        </div>
      )}
    </div>
  );
}