import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_ROUTE_PREFIXES,
  DEFAULT_AUTH_REDIRECT,
  PROTECTED_ROUTE_PREFIXES,
} from "@/lib/constants/auth";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * 刷新 Supabase 会话，并对登录页 / 受保护路由做鉴权重定向。
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((route) =>
    pathname.startsWith(route),
  );
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((route) =>
    pathname.startsWith(route),
  );

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
