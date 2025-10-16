// app/admin/academic-years/create/page.tsx
"use client"; // 👈 จำเป็นมาก: หน้านี้มี state และ event handler

import { useState, FormEvent } from 'react';

export default function CreateAcademicYearPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // ป้องกันการ reload หน้า
    setIsLoading(true);
    setMessage(null);
    setError(null);

    // 1. ใช้ FormData เพื่อจับข้อมูลฟอร์มและไฟล์
    const formData = new FormData(event.currentTarget);

    // 2. (Optional) ตรวจสอบไฟล์เบื้องต้น
    const file = formData.get('studentFile') as File;
    if (!file || file.size === 0) {
      setError('กรุณาเลือกไฟล์ Excel ของนักเรียน');
      setIsLoading(false);
      return;
    }

    try {
      // 3. ยิง API ไปยัง Endpoint ที่เราสร้างไว้
      // (เราตกลงกันว่าจะย้ายไปที่ /api/admin/...)
      const response = await fetch('/api/admin/academic-years', {
        method: 'POST',
        body: formData,
        // ไม่ต้องใส่ 'Content-Type': 'multipart/form-data'
        // Browser จะจัดการให้เองเมื่อ body เป็น FormData
      });

      const data = await response.json();

      if (!response.ok) {
        // ถ้า Server ตอบกลับมาเป็น Error (เช่น 400, 500)
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างโครงการ');
      }

      // 4. สำเร็จ!
      setMessage(`สร้างโครงการสำเร็จ: ${data.data.name} (นำเข้า ${data.data.studentsImported} คน)`);
      (event.target as HTMLFormElement).reset(); // เคลียร์ฟอร์ม

    } catch (err: any) {
      // 5. จัดการ Error ที่เกิดขึ้น
      console.error(err);
      setError(err.message);
    } finally {
      // 6. หยุด Loading เสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">สร้างโครงการรับสมัครใหม่</h1>

      {/* ใช้ Tailwind CSS สำหรับ styling (ปรับได้ตามชอบ) */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        
        {/* ส่วนที่ 1: ข้อมูลโครงการ (AcademicYear) */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold px-2">ข้อมูลโครงการ</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                ชื่อโครงการ (เช่น "การรับสมัครปีการศึกษา 2568")
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                ปีการศึกษา (เช่น 2568)
              </label>
              <input
                type="number"
                id="year"
                name="year"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="phase2StartDate" className="block text-sm font-medium text-gray-700">
                วันที่เปิด เฟส 2 (ยืนยันสิทธิ์สอบ)
              </label>
              <input
                type="datetime-local"
                id="phase2StartDate"
                name="phase2StartDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phase2EndDate" className="block text-sm font-medium text-gray-700">
                วันที่ปิด เฟส 2
              </label>
              <input
                type="datetime-local"
                id="phase2EndDate"
                name="phase2EndDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="phase3StartDate" className="block text-sm font-medium text-gray-700">
                วันที่เปิด เฟส 3 (ยืนยันสิทธิ์/มอบตัว)
              </label>
              <input
                type="datetime-local"
                id="phase3StartDate"
                name="phase3StartDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phase3EndDate" className="block text-sm font-medium text-gray-700">
                วันที่ปิด เฟส 3
              </label>
              <input
                type="datetime-local"
                id="phase3EndDate"
                name="phase3EndDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="isActive" className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                value="true" // 👈 สำคัญ: Zod จะ Coerce "true" เป็น boolean
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                ตั้งเป็นโครงการที่ใช้งานปัจจุบัน (Active)
                <span className="text-xs text-gray-500 block">(หากเลือก ระบบจะปิดโครงการอื่นที่ Active อยู่)</span>
              </span>
            </label>
          </div>
        </fieldset>

        {/* ส่วนที่ 2: Import Excel */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold px-2">ไฟล์ข้อมูลนักเรียน</legend>
          <div className="mt-4">
            <label htmlFor="studentFile" className="block text-sm font-medium text-gray-700">
              อัปโหลดไฟล์ Excel (.xlsx, .xls)
            </label>
            <input
              type="file"
              id="studentFile"
              name="studentFile"
              required
              accept=".xlsx, .xls"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </fieldset>

        {/* ส่วนที่ 3: แสดงผลลัพธ์และปุ่ม Submit */}
        <div>
          {/* แสดงข้อความ Success */}
          {message && (
            <div className="my-4 p-3 rounded-md bg-green-100 text-green-700">
              {message}
            </div>
          )}

          {/* แสดงข้อความ Error */}
          {error && (
            <div className="my-4 p-3 rounded-md bg-red-100 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading} // 👈 ปิดปุ่มเมื่อกำลังโหลด
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'กำลังประมวลผล...' : 'สร้างโครงการ และ Import ข้อมูล'}
          </button>
        </div>
      </form>
    </main>
  );
}