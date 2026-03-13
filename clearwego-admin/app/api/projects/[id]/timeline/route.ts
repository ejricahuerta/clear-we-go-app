import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET: timeline events for this project (project_created, stage changes, crew, checklist, etc.). */
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

  const { data: events, error } = await supabase
    .from("timeline_events")
    .select("id, event_type, event_description, event_category, created_by_name, created_by_role, created_at, details")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}
