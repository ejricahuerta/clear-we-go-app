import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EDITABLE_KEYS = [
  "first_name", "last_name", "email", "phone", "address", "neighbourhood",
  "client_type", "referral_source", "sms_opted_out", "google_review_received", "notes",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_KEYS) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: client, error: updateError } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const changedFields = Object.keys(updates);
  const detailDesc =
    changedFields.length === 1 && changedFields[0] === "notes"
      ? "Notes updated"
      : changedFields.filter((k) => k !== "notes").join(", ") || "Details updated";
  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id: id,
    event_type: "client_updated",
    event_category: "client",
    event_description: `Client ${detailDesc} by ${profile.name}`,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
    details: { updated_fields: changedFields },
  });
  if (timelineError) {
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  return NextResponse.json(client);
}
