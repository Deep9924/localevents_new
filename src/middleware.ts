import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Log all auth-related requests to debug production issues
  if (pathname.startsWith("/api/auth")) {
    console.log("[Middleware Debug] Auth Request:", {
      pathname,
      method: request.method,
      host: request.headers.get("host"),
      proto: request.headers.get("x-forwarded-proto"),
      error: searchParams.get("error"),
      code: searchParams.get("code"),
      state: searchParams.get("state"),
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
