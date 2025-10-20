import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    const role = token?.role as string | undefined;

    // Admin routes - only ADMIN can access
    if (path.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Staff routes - only STAFF can access
    if (path.startsWith("/staff")) {
      if (role !== "STAFF" && role !== "staff") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // User routes - only USER can access
    if (path.startsWith("/user")) {
      if (role !== "USER" && role !== "user") {
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

// Protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/user/:path*",
  ],
};