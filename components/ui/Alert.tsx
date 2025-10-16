// ✨ NEW: สร้างไฟล์และ Component ใหม่ทั้งหมด
"use client";

import React from 'react';
interface AlertProps {
  message: string;
  type: 'success' | 'error';
}

export const Alert = ({ message, type }: AlertProps) => {

const styles: Record<typeof type, { container: string; icon: React.ReactNode }> = {
      success: {
      container: "bg-green-50 border-green-400 text-green-800",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      container: "bg-red-50 border-red-400 text-red-800",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1-5a1 1 0 0 0 2 0v-2a1 1 0 0 0-2 0v2Zm1-10a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1Z" clipRule="evenodd" />
        </svg>
      )
    },
  };

  const selectedStyle = styles[type];

  return (
    <div className={`border px-4 py-3 rounded-md flex items-center gap-3 ${selectedStyle.container}`} role="alert">
      <span className="flex-shrink-0">{selectedStyle.icon}</span>
      <p>{message}</p>
    </div>
  )
};