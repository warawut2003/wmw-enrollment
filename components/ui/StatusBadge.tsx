import React from "react";

type StatusType =
    'AWAITING_PHASE2_DOCS' |
    'PENDING_APPROVAL' |
    'ELIGIBLE_FOR_EXAM' |
    'INCORRECT_DOCS' |
    'CONFIRMED' |
    'ENROLLED' |
    'WITHDRAWN' |
    // Document Statuses
    'PENDING' |
    'APPROVED' |
    'REJECTED';

interface StatusBadgeProps {
    status: StatusType | string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const statusStyles: Record<StatusType, { text: string; className: string }> = {
        // Application Statuses
        AWAITING_PHASE2_DOCS: { text: 'รอดำเนินการ', className: 'bg-gray-100 text-gray-800' },
        PENDING_APPROVAL: { text: 'รอตรวจสอบ', className: 'bg-yellow-100 text-yellow-800' },
        ELIGIBLE_FOR_EXAM: { text: 'มีสิทธิ์สอบ', className: 'bg-green-100 text-green-800' },
        INCORRECT_DOCS: { text: 'เอกสารไม่ถูกต้อง', className: 'bg-red-100 text-red-800' },
        CONFIRMED: { text: 'ยืนยันสิทธิ์แล้ว', className: 'bg-blue-100 text-blue-800' },

        // Document Statuses
        PENDING: { text: 'รอตรวจสอบ', className: 'bg-yellow-100 text-yellow-800' },
        APPROVED: { text: 'เอกสารผ่าน', className: 'bg-green-100 text-green-800' },
        REJECTED: { text: 'เอกสารไม่ผ่าน', className: 'bg-red-100 text-red-800' },

        // Default / Fallback cases
        ENROLLED: { text: 'มอบตัวสำเร็จ', className: 'bg-green-100 text-green-800' },
        WITHDRAWN: { text: 'สละสิทธิ์', className: 'bg-gray-100 text-gray-800' },
    };

    const style = statusStyles[status as StatusType] || statusStyles.AWAITING_PHASE2_DOCS;

    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${style.className}`}>
            {style.text}
        </span>
    )
}

export default StatusBadge;