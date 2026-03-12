import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

/** Accept invite by token + email (no session required). Used right after signUp when session may not be set yet. */
export async function POST(request: Request) {
  const body = await request.json();
  const token = (body?.token as string)?.trim()?.toLowerCase();
  const email = (body?.email as string)?.trim()?.toLowerCase();
  if (!token || !email) {
    return NextResponse.json({ error: "Token and email required" }, { status: 400 });
  }
  if (token.length !== 64 || !/^[0-9a-f]+$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const service = createServiceRoleClient();

  const { data: invite, error: findError } = await service
    .from("invites")
    .select("id, email, expires_at")
    .eq("token", tokenHash)
    .eq("accepted", false)
    .single();

  if (findError || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  if (invite.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Email does not match invite" }, { status: 400 });
  }

  const raw = String(invite.expires_at).trim().replace(" ", "T");
  const normalized = raw.replace(/([+-])(\d{2})$/, "$1$2:00");
  const expiresAt = new Date(normalized);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
  }

  const { error: updateError } = await service
    .from("invites")
    .update({ accepted: true, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
