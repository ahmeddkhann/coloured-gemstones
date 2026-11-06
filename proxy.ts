import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isAuthPage =
      pathname === "/admin/login" ||
      pathname === "/admin/signup" ||
      pathname === "/admin/verify-otp" ||
      pathname.startsWith("/admin/forgot-password");
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!isAuthPage && !token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const isForgotPassword = pathname.startsWith("/admin/forgot-password");
    if (isAuthPage && token && !isForgotPassword) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    const isAuthPage =
      pathname === "/account/login" ||
      pathname === "/account/signup" ||
      pathname === "/account/verify-otp" ||
      pathname.startsWith("/account/forgot-password");
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!isAuthPage && !token) {
      return NextResponse.redirect(new URL("/account/login", request.url));
    }

    const isForgotPassword = pathname.startsWith("/account/forgot-password");
    if (isAuthPage && token && !isForgotPassword) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
