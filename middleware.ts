import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const LOGIN_PATH = "/access";
const PROTECTED_PREFIXES = ["/admin", "/dashboard"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && user) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
    const destination = request.nextUrl.clone();
    destination.pathname = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
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
