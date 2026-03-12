import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { data: events, error } = await supabase
    .from("timeline_events")
    .select("id, event_type, event_description, event_category, created_by_name, created_by_role, created_at, details")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}

/** Log a timeline event for this client (e.g. client_note_added). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
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
  const eventType = body?.event_type ?? "client_note_added";
  const eventCategory = body?.event_category ?? "client";
  const eventDescription = body?.event_description ?? "";
  const details = body?.details ?? {};

  const { error: insertError } = await supabase.from("timeline_events").insert({
    client_id: clientId,
    event_type: eventType,
    event_category: eventCategory,
    event_description: eventDescription,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
    details: typeof details === "object" ? details : {},
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
