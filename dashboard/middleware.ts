import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Dev bypass: if the dev session cookie is set, treat as authenticated
  const devSession = request.cookies.get("wp_dev_session")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: call getUser() on every request to refresh the session token
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Supabase not configured yet — dev bypass handles auth
  }

  const { pathname } = request.nextUrl;

  // Only /dashboard/* is protected — the landing page at "/" is public
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthenticated = !!user || devSession === "1";

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|signup|auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
