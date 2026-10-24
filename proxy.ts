import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/verify-otp" ||
    pathname.startsWith("/admin/forgot-password");
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (pathname.startsWith("/admin") && !isAuthPage && !token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Keep forgot-password steps available even if an old admin cookie remains.
  const isForgotPassword = pathname.startsWith("/admin/forgot-password");
  if (isAuthPage && token && !isForgotPassword) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
