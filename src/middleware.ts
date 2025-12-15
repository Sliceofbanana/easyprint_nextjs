import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log('🔐 Middleware - Path:', path, 'Role:', token?.role); // ✅ Debug log

    const role = token?.role as string | undefined;

    // Admin routes
    if (path.startsWith("/admin")) {
      if (role?.toUpperCase() !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Staff routes
    if (path.startsWith("/staff")) {
      if (role?.toUpperCase() !== "STAFF") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // User routes
    if (path.startsWith("/user")) {
      if (role?.toUpperCase() !== "USER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/user/:path*",
    "/order/:path*",
    "/profile/:path*",
    "/support/:path*",
  ],
};