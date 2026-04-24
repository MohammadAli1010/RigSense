import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const proxy = auth((req) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  
  // Apply a basic rate limit for all API routes or auth routes
  const { nextUrl } = req;
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  
  if (isApiRoute || isAuthRoute) {
    // 60 requests per minute for API and auth routes
    const { success, limit, remaining, reset } = checkRateLimit(ip, 60, 60 * 1000);
    
    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isModerator = req.auth?.user?.role === "MODERATOR";
  const isEditor = req.auth?.user?.role === "EDITOR";
  
  const hasAdminAccess = isAdmin || isModerator || isEditor;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProtectedRoute = nextUrl.pathname.startsWith("/profile");

  // Auth routes redirect to profile if already logged in
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/profile", nextUrl));
    }
  }

  // Admin routes require admin access
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (!hasAdminAccess) {
      // Could redirect to a 403 page, but / will do for now
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Profile routes require login
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};