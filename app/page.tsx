import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-blue-100 text-gray-800">
      {/* 🌌 เอฟเฟกต์พื้นหลังแบบกาแล็กซี่ */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-150px] right-[-100px] w-[550px] h-[550px] bg-sky-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-violet-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* กล่องเนื้อหา */}
      <section className="relative bg-white/80 backdrop-blur-xl border border-indigo-200 shadow-2xl rounded-3xl px-10 py-14 text-center max-w-2xl w-[90%] hover:shadow-indigo-100 transition-all duration-700">
        {/* โลโก้ */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-400 blur-xl opacity-50 rounded-full animate-ping"></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-sky-500 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white text-4xl font-extrabold tracking-wide drop-shadow-md">
                วมว
              </span>
            </div>
          </div>
        </div>

        {/* ข้อความหลัก */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-violet-500 mb-4 leading-snug drop-shadow-sm">
          สมัครเรียนสายวิทยาศาสตร์<br />สู่อนาคตที่ไร้ขีดจำกัด
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed">
          โครงการ วมว. เปิดโอกาสให้นักเรียนที่มีใจรักวิทยาศาสตร์<br />
          ได้เรียนรู้ ค้นคว้า และสร้างสรรค์นวัตกรรมจริง
        </p>

        {/* เส้นคั่น */}
        <div className="mt-8 mb-4 w-28 h-[3px] bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 mx-auto rounded-full animate-pulse"></div>

        {/* ข้อความรอง */}
        <p className="text-sm text-gray-500 italic tracking-wide">
          Science Classrooms in University Affiliated School Project
        </p>
      </section>

      {/* เอฟเฟกต์ดาวเล็ก ๆ */}
      <div className="absolute inset-0 -z-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 text-center text-gray-400 text-xs tracking-wide">
        © 2025 โครงการ วมว. มหาวิทยาลัยทักษิณ | All rights reserved.
      </div>
    </main>
  );
}
