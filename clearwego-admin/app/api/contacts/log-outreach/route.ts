import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  const body = await request.json();
  const contactId = body?.contactId ?? body?.contact_id;
  const emailNumber = parseInt(body?.emailNumber ?? body?.email_number, 10);

  if (!contactId || ![1, 2, 3].includes(emailNumber)) {
    return NextResponse.json({ error: "contactId and emailNumber (1, 2, or 3) required" }, { status: 400 });
  }

  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("id, first_name, status")
    .eq("id", contactId)
    .single();

  if (fetchError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    last_contacted_date: new Date().toISOString(),
    follow_up_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
  updates[`email_${emailNumber}_sent`] = true;
  updates[`email_${emailNumber}_date`] = new Date().toISOString();
  if (contact.status === "new" || contact.status === "reopened") {
    updates.status = "contacted";
  }

  const { error: updateError } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
