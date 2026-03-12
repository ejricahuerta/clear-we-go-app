import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim().toLowerCase();
  if (!token || token.length !== 64 || !/^[0-9a-f]+$/.test(token)) {
    return NextResponse.json({ error: "invalid", message: "Invalid link" }, { status: 404 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const service = createServiceRoleClient();

  const { data: invite, error } = await service
    .from("invites")
    .select("email, name, expires_at, accepted")
    .eq("token", tokenHash)
    .single();

  if (error || !invite) {
    if (process.env.NODE_ENV === "development") {
      console.log("[invite/validate] No row or error:", error?.message ?? "no data");
    }
    return NextResponse.json({ error: "invalid", message: "Invalid link" }, { status: 404 });
  }

  if (invite.accepted) {
    return NextResponse.json({ error: "already_used", message: "This link was already used." }, { status: 404 });
  }

  // Normalize Supabase timestamptz (e.g. "2026-03-14 19:15:49.222+00" or "2026-03-14T19:15:49.222+00:00")
  const raw = String(invite.expires_at).trim().replace(" ", "T");
  const normalized = raw.replace(/([+-])(\d{2})$/, "$1$2:00"); // +00 -> +00:00 for reliable parsing
  const expiresAt = new Date(normalized);
  const now = new Date();
  const isExpired = Number.isNaN(expiresAt.getTime()) || expiresAt <= now;

  if (process.env.NODE_ENV === "development") {
    console.log("[invite/validate] expires_at raw:", raw, "| parsed:", expiresAt.toISOString(), "| now:", now.toISOString(), "| isExpired:", isExpired);
  }

  if (isExpired) {
    return NextResponse.json({ error: "expired", message: "This link has expired." }, { status: 404 });
  }

  return NextResponse.json({ email: invite.email, name: invite.name });
}
