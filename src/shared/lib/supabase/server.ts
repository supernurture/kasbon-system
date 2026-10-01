import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/shared/lib/env";
import type { Database } from "./database.types";

// One client per request: it carries the caller's session, so every query runs under their RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
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
            // Server Components can't write cookies; proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}

export async function getCurrentUser() {
  const supabase = await createClient();
  // getUser() verifies the JWT with Supabase Auth; getSession() would trust the cookie blindly.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
