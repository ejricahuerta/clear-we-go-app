import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Canonical app URL for redirects. Set NEXT_PUBLIC_APP_URL e.g. https://admin.clearwego.ca */
function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const base = getBaseUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, base));
    }
  }

  return NextResponse.redirect(new URL(next, base));
}
