import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config"; // edge-safe: no Prisma, no bcrypt

const { auth } = NextAuth(authConfig);

const STAFF_ROLES = ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"];
const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

export default auth((req) => {
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && (!role || !ADMIN_ROLES.includes(role))) {
    return NextResponse.redirect(new URL("/api/auth/signin?callbackUrl=" + encodeURIComponent(pathname), req.url));
  }
  if (pathname.startsWith("/pos") && (!role || !STAFF_ROLES.includes(role))) {
    return NextResponse.redirect(new URL("/api/auth/signin?callbackUrl=" + encodeURIComponent(pathname), req.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/pos/:path*"] };
