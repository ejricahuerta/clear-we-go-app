import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET: list checklist items for this project (ordered by sort_order). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: items, error } = await supabase
    .from("checklist_items")
    .select("id, item_text, completed, completed_by, completed_at, sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: items ?? [] });
}

/** PATCH: toggle one checklist item completed. Body: { item_id: string, completed: boolean }. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const item_id = body?.item_id as string | undefined;
  const completed = body?.completed === true;

  if (!item_id) {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("auth_user_id", authUser.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("checklist_items")
    .select("id, project_id, item_text")
    .eq("id", item_id)
    .eq("project_id", projectId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
  }

  const update: { completed: boolean; completed_by: string | null; completed_at: string | null } = completed
    ? { completed: true, completed_by: profile.id, completed_at: new Date().toISOString() }
    : { completed: false, completed_by: null, completed_at: null };

  const { data: updated, error: updateError } = await supabase
    .from("checklist_items")
    .update(update)
    .eq("id", item_id)
    .eq("project_id", projectId)
    .select("id, item_text, completed, completed_by, completed_at, sort_order")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (completed && profile.role === "crew") {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();
    if (project?.client_id) {
      await supabase.from("timeline_events").insert({
        client_id: project.client_id,
        project_id: projectId,
        event_type: "checklist_item_completed",
        event_category: "crew",
        event_description: `${profile.name} completed: ${existing.item_text}`,
        created_by_id: profile.id,
        created_by_name: profile.name,
        created_by_role: profile.role,
      });
    }
  }

  return NextResponse.json(updated);
}
