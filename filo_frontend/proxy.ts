import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { User, Admin } from "./types";
import { adminTokenVerify, userTokenVerify } from "./lib/actions/auth";

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  path: "/",
  maxAge: maxAgeSeconds,
});
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes, in seconds
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

const userPublicRoutes = ["/", "/share", "/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];
const userAuthRoutes = ["/auth/login", "/auth/signup"];
const userProtectedRoutes = ["/dashboard", "/dashboard/subscription", "/dashboard/folders"];
const userRoutes = [userPublicRoutes, userAuthRoutes, userProtectedRoutes].flat();

const adminProtectedRoutes = ["/admin/dashboard"];
const adminAuthRoutes = ["/admin/login"];
const adminRoutes = [adminProtectedRoutes, adminAuthRoutes].flat();

// Helper: exact match OR starts with route + "/"
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isUserPublicRoute = matchesRoute(pathname, userPublicRoutes);
  const isUserProtectedRoute = matchesRoute(pathname, userProtectedRoutes);
  const isUserAuthRoute = matchesRoute(pathname, userAuthRoutes);

  const isAdminProtectedRoute = matchesRoute(pathname, adminProtectedRoutes);
  const isAdminAuthRoute = matchesRoute(pathname, adminAuthRoutes);

  const isUserRoute = matchesRoute(pathname, userRoutes);
  const isAdminRoute = matchesRoute(pathname, adminRoutes);

  // PUBLIC ROUTES → ALWAYS ALLOW
  if (isUserPublicRoute) {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  if (isAdminRoute) {
    const adminAccessToken = cookieStore.get("admin_access_token")?.value;

    let admin: Admin | null = null;
    let newTokens: { access: string; refresh: string } | undefined;
    if (adminAccessToken) {
      const result = await adminTokenVerify(adminAccessToken);

      admin = result?.admin ?? null;
      newTokens = result?.newTokens;
    }

    // Logged-in admin visiting login
    if (isAdminAuthRoute && admin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Protected admin routes require auth
    if (isAdminProtectedRoute && !admin) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);

      const response = NextResponse.redirect(loginUrl);

      response.cookies.delete("admin_access_token");
      response.cookies.delete("admin_refresh_token");

      return response;
    }

    if (newTokens) {
      const response = NextResponse.next();

      response.cookies.set("admin_access_token", newTokens.access, cookieOptions(ACCESS_TOKEN_MAX_AGE));
      response.cookies.set("admin_refresh_token", newTokens.refresh, cookieOptions(REFRESH_TOKEN_MAX_AGE));

      return response;
    }
  }

  if (isUserRoute) {
    const userAccessToken = cookieStore.get("user_access_token")?.value;

    let user: User | null = null;
    let newTokens: { access: string; refresh: string } | undefined;
    if (userAccessToken) {
      const result = await userTokenVerify(userAccessToken);

      user = result?.user ?? null;
      newTokens = result?.newTokens;
    }

    // Logged-in user visiting login/signup
    if (isUserAuthRoute && user) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protected routes require auth
    if (isUserProtectedRoute && !user) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);

      const response = NextResponse.redirect(loginUrl);

      response.cookies.delete("user_access_token");
      response.cookies.delete("user_refresh_token");

      return response;
    }

    if (newTokens) {
      const response = NextResponse.next();

      response.cookies.set("user_access_token", newTokens.access, cookieOptions(ACCESS_TOKEN_MAX_AGE));
      response.cookies.set("user_refresh_token", newTokens.refresh, cookieOptions(REFRESH_TOKEN_MAX_AGE));

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
