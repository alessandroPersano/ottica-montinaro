import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsSession = path.startsWith("/area-personale") || path.startsWith("/admin") || path.startsWith("/checkout");
  if (needsSession && !getSessionCookie(request)) {
    const url = new URL("/accesso", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/area-personale", "/area-personale/:path*", "/admin", "/admin/:path*", "/checkout", "/checkout/:path*"],
};
