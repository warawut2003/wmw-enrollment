export default function Homepage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">แดชบอร์ดหลัก (Overview)</h1>
      <p>สรุปภาพรวมของระบบ เช่น จำนวนผู้สมัคร ยืนยันสิทธิ์ สละสิทธิ์ ฯลฯ</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">นักเรียนทั้งหมด</h2>
          <p className="text-2xl font-bold text-blue-600">120</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">ยืนยันสิทธิ์</h2>
          <p className="text-2xl font-bold text-green-600">80</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">สละสิทธิ์</h2>
          <p className="text-2xl font-bold text-red-600">20</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">รอตรวจสอบ</h2>
          <p className="text-2xl font-bold text-yellow-500">20</p>
        </div>
      </div>
    </section>
  );
}
