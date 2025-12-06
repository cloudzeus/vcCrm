import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "INFLUENCER" | "CLIENT";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: UserRole; organizationId?: string | null } | undefined;

  // Public routes
  const publicRoutes = ["/", "/login", "/register", "/api/public"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // API routes - allow public API routes
  if (pathname.startsWith("/api/public")) {
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes - require SUPERADMIN or OWNER
  if (pathname.startsWith("/admin")) {
    if (user.role !== "SUPERADMIN" && user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Organization/Settings routes - require OWNER or MANAGER
  if (pathname.startsWith("/org") || pathname.startsWith("/settings")) {
    if (user.role !== "OWNER" && user.role !== "MANAGER" && user.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // App routes - require any authenticated user
  if (pathname.startsWith("/app") || pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

