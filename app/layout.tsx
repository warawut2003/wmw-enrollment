import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "โครงการ วมว - ระบบรับสมัครนักเรียน",
  description: "เปิดรับสมัครนักเรียนเข้าศึกษาต่อระดับชั้น ม.4 ในโครงการ วมว (โครงการสนับสนุนการจัดตั้งห้องเรียนวิทยาศาสตร์ในโรงเรียน) ดูรายละเอียดและสมัครได้ที่นี่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
