import { createClient } from "@supabase/supabase-js";

/**
 * Server-only. Use for actions that need to bypass RLS (e.g. fetch user role by auth_user_id).
 * Never expose this client to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or URL");
  return createClient(url, key);
}
