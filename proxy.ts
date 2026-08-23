import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeSessionEdge, SESSION_COOKIE_NAME } from "@/lib/auth/middleware-session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/google/start",
  "/api/auth/google/callback",
  "/api/calendar/google/oauth/callback",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/)
  ) {
    return true;
  }
  return false;
}

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/")) return !isPublicPath(pathname);
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/study") ||
    pathname.startsWith("/core") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/assignments") ||
    pathname.startsWith("/flashcards") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/quizzes") ||
    pathname.startsWith("/search") ||
    pathname === "/"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) || isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = await decodeSessionEdge(token);
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decodeSessionEdge(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
