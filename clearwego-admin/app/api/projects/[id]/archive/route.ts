import { createClient } from "@/lib/supabase/server";
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
  if (profile.role !== "owner" && profile.role !== "admin") {
    return NextResponse.json({ error: "Only owner or admin can archive a project" }, { status: 403 });
  }

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, client_id, archived_at, property_address, service_type")
    .eq("id", id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.archived_at != null) {
    return NextResponse.json({ error: "Project is already archived" }, { status: 400 });
  }

  const address = project.property_address ?? "";
  const serviceType = project.service_type ?? "";

  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id: project.client_id,
    project_id: id,
    event_type: "project_archived",
    event_category: "project",
    event_description: `Project archived by ${profile.name}: ${String(serviceType).replace(/_/g, " ")} at ${address}`,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
  });
  if (timelineError) {
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  const { data: updated, error: updError } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null)
    .select()
    .single();

  if (updError || !updated) {
    return NextResponse.json({ error: updError?.message ?? "Failed to archive project" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
