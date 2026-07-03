import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/utils/auth/roles";
import { updateSession } from "@/utils/supabase/middleware";

const LOGIN_PATH = "/access";
const DASHBOARD_PATH = "/dashboard";

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isAdminRoute(pathname: string) {
  return matchesPrefix(pathname, "/admin");
}

function isDashboardRoute(pathname: string) {
  return matchesPrefix(pathname, DASHBOARD_PATH);
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isAdminRoute(pathname)) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin(user)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = DASHBOARD_PATH;
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  if (isDashboardRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && user) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirectTo") || DASHBOARD_PATH;
    const destination = request.nextUrl.clone();
    destination.pathname = redirectTo.startsWith("/") ? redirectTo : DASHBOARD_PATH;

    if (isAdminRoute(destination.pathname) && !isAdmin(user)) {
      destination.pathname = DASHBOARD_PATH;
    }

    destination.search = "";
    return NextResponse.redirect(destination);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};