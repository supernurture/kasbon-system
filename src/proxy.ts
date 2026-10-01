import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/shared/lib/env";

const AUTH_PATHS = ["/login"];

// Refreshes the Supabase session cookie on every request and gates pages by auth state.
// API routes are not redirected here; they answer 401 JSON on their own.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api")) return response;

  const isAuthPath = AUTH_PATHS.includes(pathname);
  if (!user && !isAuthPath) return redirectWithCookies(request, response, "/login");
  if (user && isAuthPath) return redirectWithCookies(request, response, "/");

  return response;
}

function redirectWithCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
