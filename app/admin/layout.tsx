import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-semibold mb-6 text-blue-600">
          Admin Panel
        </h2>
        <nav className="space-y-2">
          <Link href="/admin" className="block hover:text-blue-600">
            🏠 หน้าหลัก
          </Link>
          <Link href="/admin/dashboard" className="block hover:text-blue-600">
            📊 Dashboard
          </Link>
          <Link href="/admin/students" className="block hover:text-blue-600">
            👩‍🎓 นักเรียนทั้งหมด
          </Link>
          <Link href="/admin/verify" className="block hover:text-blue-600">
            📑 ตรวจสอบเอกสาร
          </Link>
          <Link href="/admin/reports" className="block hover:text-blue-600">
            📤 รายงาน / Export
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
