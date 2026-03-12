import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const STAGES = [
  "inquiry", "walkthrough_booked", "quoted", "deposit_received",
  "scheduled", "in_progress", "cleared", "report_sent", "review_requested", "closed",
] as const;
const EDITABLE_KEYS = [
  "property_size", "property_address", "neighbourhood", "walkthrough_date", "walkthrough_method",
  "job_date", "start_time", "quote_amount", "deposit_received", "deposit_amount",
  "invoice_amount", "payment_received", "bin_vendor", "bin_cost", "rooms_cleared",
  "unexpected_items_found", "client_notified_of_unexpected", "before_photos_uploaded", "after_photos_uploaded",
  "completion_report_sent", "report_sent_date", "review_requested", "review_received", "notes",
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

  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      clients(id, first_name, last_name, email, phone)
    `)
    .eq("id", id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const client = Array.isArray(project.clients) ? project.clients[0] : project.clients;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit clients from response
  const { clients, ...rest } = project as { clients?: unknown } & Record<string, unknown>;
  return NextResponse.json({
    ...rest,
    client_name: client ? `${(client as { first_name: string }).first_name} ${(client as { last_name: string }).last_name}` : null,
  });
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

  const newStage = body?.stage;
  if (newStage && STAGES.includes(newStage as (typeof STAGES)[number])) {
    updates.stage = newStage;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("client_id, stage")
    .eq("id", id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const oldStage = existing.stage as string;
  const { data: project, error: updateError } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (newStage && newStage !== oldStage) {
    const { error: timelineError } = await supabase.from("timeline_events").insert({
      client_id: existing.client_id,
      project_id: id,
      event_type: "project_stage_changed",
      event_category: "project",
      event_description: `Project moved from ${oldStage.replace(/_/g, " ")} to ${String(newStage).replace(/_/g, " ")} by ${profile.name}`,
      created_by_id: profile.id,
      created_by_name: profile.name,
      created_by_role: profile.role,
      details: { old_stage: oldStage, new_stage: newStage },
    });
    if (timelineError) {
      return NextResponse.json({ error: timelineError.message }, { status: 500 });
    }
  }

  return NextResponse.json(project);
}
