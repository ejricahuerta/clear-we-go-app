import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

const CREW_APP_URL = process.env.CREW_APP_URL ?? "https://crew.clearwego.ca";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!me || me.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can send invites" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email } = body as { name?: string; email?: string };
  if (!name || !email || typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const nameTrimmed = name.trim();
  if (!emailTrimmed || !nameTrimmed) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data: existingUser } = await service
    .from("users")
    .select("id")
    .eq("email", emailTrimmed)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
  }

  const { data: newUser, error: insertUserError } = await service
    .from("users")
    .insert({
      name: nameTrimmed,
      email: emailTrimmed,
      role: "crew",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertUserError || !newUser) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: inviteError } = await service.from("invites").insert({
    email: emailTrimmed,
    name: nameTrimmed,
    role: "crew",
    token: tokenHash,
    expires_at: expiresAt,
    created_by: me.id,
  });

  if (inviteError) {
    await service.from("users").delete().eq("id", newUser.id);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  const setupLink = `${CREW_APP_URL}/setup?token=${rawToken}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email not configured. Set RESEND_API_KEY." },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM ?? "Clear We Go <noreply@clearwego.ca>";
  const firstName = nameTrimmed.split(/\s+/)[0] || nameTrimmed;
  const { error: emailError } = await resend.emails.send({
    from: fromAddress,
    to: [emailTrimmed],
    subject: "You've been invited to Clear We Go",
    html: `
      <p>Hi ${firstName},</p>
      <p>You've been added to the Clear We Go crew app.</p>
      <p>Tap below to set up your account.</p>
      <p><a href="${setupLink}" style="display:inline-block; padding: 12px 24px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px;">Set up my account</a></p>
      <p>This link expires in 48 hours.</p>
      <p>Clear We Go<br/>crew.clearwego.ca</p>
    `,
  });

  if (emailError) {
    return NextResponse.json(
      { error: "Invite created but email failed to send. Check RESEND_API_KEY and domain." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
