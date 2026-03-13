import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_AUTH_COOKIE_NAME } from "./cookie-name";

/**
 * Supabase client for use in Server Components / Route Handlers.
 * Uses the request cookie store so auth state is respected.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore in Server Component context
        }
      },
    },
  });
}
