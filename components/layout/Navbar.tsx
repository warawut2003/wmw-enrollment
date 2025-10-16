"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Button from "../ui/Button";

// --- ไอคอนไม่เปลี่ยนแปลง ---
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function Navbar() {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ✨ 1. สร้าง Component สำหรับแสดงลิงก์นำทาง เพื่อลดโค้ดซ้ำซ้อน
    const NavLinks = () => (
        <>
            {/* ถ้าล็อกอินแล้ว ให้แสดงลิงก์ไปหน้า Dashboard */}
            {session && (
                <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-md text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)} // คลิกแล้วให้ปิดเมนูมือถือ
                >
                    หน้าหลัก (Dashboard)
                </Link>
            )}
            {/* สามารถเพิ่มลิงก์อื่นๆ ได้ที่นี่ */}
        </>
    );

    // ✨ 2. ปรับปรุงฟังก์ชัน renderUserActions ให้น่าสนใจขึ้น
    const renderUserActions = () => {
        if (status === "loading") {
            return <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>;
        }

        if (session) {
            return (
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                        {session.user?.name || session.user?.email}
                    </span>
                    <Button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        variant="secondary"
                        className="!w-auto text-sm"
                    >
                        ออกจากระบบ
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Link href="/sign-in" passHref>
                    <Button variant="secondary" className="!w-auto text-sm">
                        เข้าสู่ระบบ
                    </Button>
                </Link>
                <Link href="/sign-up" passHref>
                    <Button variant="primary" className="!w-auto text-sm">
                        ลงทะเบียน
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            {/* ✨ 3. ปรับปรุงโครงสร้าง Layout หลัก */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* ส่วนซ้าย: โลโก้ และลิงก์นำทางสำหรับ Desktop */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 text-xl font-bold text-indigo-600">
                            โครงการ วมว.
                        </Link>
                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <NavLinks />
                            </div>
                        </div>
                    </div>

                    {/* ส่วนขวา: ปุ่ม User และปุ่ม Hamburger */}
                    <div className="hidden md:block">
                        {renderUserActions()}
                    </div>
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ✨ 4. ปรับปรุงเมนูสำหรับมือถือ */}
            <div
                className={`transition-all duration-300 ease-in-out md:hidden ${
                    isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <NavLinks />
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="px-2 flex justify-center">
                        {renderUserActions()}
                    </div>
                </div>
            </div>
        </nav>
    )
}