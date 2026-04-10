import { createClient } from "@/lib/supabase/server";
import { unlinkContactsFromClient } from "@/lib/clients/create-from-contact";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
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

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id, archived_at")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (client.archived_at != null) {
    return NextResponse.json({ error: "Client is already archived" }, { status: 400 });
  }

  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id: id,
    event_type: "client_archived",
    event_category: "client",
    event_description: `Removed from active client list; linked contact marked Archived by ${profile.name}`,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
  });
  if (timelineError) {
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  await unlinkContactsFromClient(supabase, id);

  const { data: updated, error: archiveError } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null)
    .select()
    .single();

  if (archiveError || !updated) {
    return NextResponse.json({ error: archiveError?.message ?? "Failed to archive client" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
