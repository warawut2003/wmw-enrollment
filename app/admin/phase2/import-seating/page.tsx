// app/admin/phase2/import-seating/page.tsx
"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';

export default function ImportSeatingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('กรุณาเลือกไฟล์ Excel');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('seatingFile', file);

    try {
      // 1. ยิง API ไปยัง Route ที่เราสร้าง
      const response = await fetch('/api/admin/phase2/update-seating', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }

      // 2. แสดงผลเมื่อสำเร็จ
      setMessage(data.message);
      (event.target as HTMLFormElement).reset(); // เคลียร์ฟอร์ม
      setFile(null);

    } catch (err: any) {
      // 3. แสดงผลเมื่อล้มเหลว
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        อัปเดตข้อมูลห้องสอบ (Import Excel)
      </h1>
      
      <Link href="/admin/phase2/applicants" className="text-blue-600 hover:underline mb-4 block">
        &larr; กลับไปหน้ารายชื่อ
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        
        <div>
          <label htmlFor="seatingFile" className="block text-sm font-medium text-gray-700">
            เลือกไฟล์ Excel (.xlsx, .xls)
          </label>
          <input
            type="file"
            id="seatingFile"
            name="seatingFile"
            onChange={handleFileChange}
            required
            accept=".xlsx, .xls"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        
        <div className='border-l-4 border-yellow-400 bg-yellow-50 p-4 text-yellow-800 text-sm'>
            <p><strong>ข้อควรระวัง:</strong> ไฟล์ Excel จะต้องมีคอลัมน์ ดังนี้:</p>
            <ul className='list-disc list-inside mt-2'>
                <li>`เลขประจำตัวประชาชน` (ต้องตรงกับในระบบ)</li>
                <li>`สนามสอบ`</li>
                <li>`ห้องสอบ`</li>
                <li>`เลขที่นั่งสอบ`</li>
            </ul>
        </div>

        <div>
          {message && (
            <div className="my-4 p-3 rounded-md bg-green-100 text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="my-4 p-3 rounded-md bg-red-100 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'กำลังประมวลผล...' : 'อัปโหลดและอัปเดตข้อมูล'}
          </button>
        </div>
      </form>
    </main>
  );
}