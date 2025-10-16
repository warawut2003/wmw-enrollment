"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Button from "../ui/Button";

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

  const NavLinks = () => {
    const role = session?.user?.role;
    return (
      <>
        {role === "STUDENT" && (
          <Link
            href="/dashboard"
            className="px-3 py-2 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md text-sm font-medium transition-all"
            onClick={() => setIsMenuOpen(false)}
          >
            หน้าหลัก (Dashboard)
          </Link>
        )}
        {role === "ADMIN" && (
          <>
            <Link
              href="/admin/phase2/applicants"
              className="px-3 py-2 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md text-sm font-medium transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              ตรวจสอบ (เฟส 2)
            </Link>
            <Link
              href="/admin/phase3/applicants"
              className="px-3 py-2 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md text-sm font-medium transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              ตรวจสอบ (เฟส 3)
            </Link>
            <Link
              href="/admin/academic-years/create"
              className="px-3 py-2 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-md text-sm font-medium transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              สร้างโครงการ
            </Link>
          </>
        )}
      </>
    );
  };

  const renderUserActions = () => {
    if (status === "loading") {
      return <div className="h-8 w-32 bg-indigo-100 rounded-md animate-pulse"></div>;
    }

    if (session) {
      return (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {session.user?.role === "ADMIN" && (
              <span className="font-bold text-indigo-600">[ADMIN] </span>
            )}
            {session.user?.email}
          </span>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="secondary"
            className="!w-auto text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all"
          >
            ออกจากระบบ
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in" passHref>
          <Button variant="secondary" className="!w-auto text-sm bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700">
            เข้าสู่ระบบ
          </Button>
        </Link>
        <Link href="/sign-up" passHref>
          <Button variant="primary" className="!w-auto text-sm bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500 hover:opacity-90 text-white shadow-md">
            ลงทะเบียน
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-indigo-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* โลโก้ + ลิงก์ */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-sky-600 to-violet-600 bg-clip-text text-transparent tracking-tight"
            >
              โครงการ วมว.
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLinks />
              </div>
            </div>
          </div>

          {/* ปุ่ม user */}
          <div className="hidden md:block">{renderUserActions()}</div>

          {/* ปุ่มเมนูมือถือ */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-700 hover:bg-indigo-50 focus:outline-none"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* เมนูมือถือ */}
      <div
        className={`transition-all duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden bg-white border-t border-indigo-100`}
      >
        <div className="px-4 pt-2 pb-3 space-y-1">
          <NavLinks />
        </div>
        <div className="px-4 pb-4 border-t border-indigo-100">{renderUserActions()}</div>
      </div>
    </nav>
  );
}
