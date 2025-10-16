import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const userRole = req.nextauth.token?.role;
        const { pathname } = req.nextUrl;

        console.log("Middleware path:", pathname, "Role:", userRole)
        const authPages = ["/sign-in", "/sign-up"]; // เพิ่มหน้า sign-up หรืออื่นๆ ที่นี่
        if (token && authPages.includes(pathname)) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        if (pathname === "/") {
            if (userRole === "ADMIN") {
                return NextResponse.redirect(new URL("/admin/phase2/applicants", req.url));
            }
            if (userRole === "STUDENT") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            return NextResponse.next();
        }

        if (pathname.startsWith("/dashboard") && userRole !== "STUDENT") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // 3. ป้องกันหน้า /admin
        // โค้ดนี้จะทำงานเมื่อ path คือ /admin และ user ล็อกอินแล้ว
        if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const { pathname } = req.nextUrl;

                // 2.1 กำหนดว่า path ไหนบ้างที่ "ต้อง" ล็อกอิน
                const isProtectedRoute = 
                    pathname.startsWith("/dashboard") ||
                    pathname.startsWith("/documents") ||
                    pathname.startsWith("/admin");

                if (isProtectedRoute) {
                    return !!token; // ถ้าเป็นหน้า "ต้องห้าม" ต้องมี token เท่านั้น
                }

                // 2.2 สำหรับ path อื่นๆ (เช่น '/') อนุญาตให้เข้าได้เลย (ทั้งคนที่มี token และไม่มี)
                return true; 
            }
        }
    }

)


export const config = {
    matcher: [
        "/",
        "/sign-in",
        "/sign-up",
        "/dashboard/:path*",
        "/documents/:path*",
        "/admin/:path*",
    ],
};