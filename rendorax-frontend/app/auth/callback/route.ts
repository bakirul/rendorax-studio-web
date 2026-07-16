import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Auth PKCE callback for password recovery (and similar code exchanges).
 * Configure redirect allow-list to include /auth/callback and /reset-password.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") || "/reset-password";
  const next = nextRaw.startsWith("/") ? nextRaw : "/reset-password";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const cookieStore = cookies();
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // ignore in edge cases
            }
          },
        },
      });
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
