import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

/** Uses public.crew_assignments (project_id, user_id, assigned_by, job_date). See supabase/migrations. */

/** GET: list crew assigned to this project + all assignable crew (role=crew). */
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

  const service = createServiceRoleClient();

  const { data: project } = await service
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const crewResult = await service.from("users").select("id, name, email").eq("role", "crew");
  const crewList = crewResult.data ?? [];

  let assignedIds = new Set<string>();
  const assignmentsResult = await service
    .from("crew_assignments")
    .select("user_id")
    .eq("project_id", projectId);
  if (!assignmentsResult.error) {
    assignedIds = new Set((assignmentsResult.data ?? []).map((r) => r.user_id));
  }

  const allCrew = crewList.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    assigned: assignedIds.has(u.id),
  }));

  return NextResponse.json({
    crew: allCrew.filter((u) => u.assigned),
    available: allCrew.filter((u) => !u.assigned),
    all: allCrew,
  });
}

/** PUT: set crew assigned to this project. Body: { user_ids: string[] } */
export async function PUT(
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
  const user_ids = Array.isArray(body?.user_ids) ? body.user_ids : [];
  const ids = user_ids.filter((id: unknown): id is string => typeof id === "string");

  const service = createServiceRoleClient();

  const { data: project } = await service
    .from("projects")
    .select("id, job_date")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: currentUser } = await service
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .single();
  const assignedBy = currentUser?.id ?? null;
  const jobDate = (project as { job_date?: string }).job_date ?? new Date().toISOString().slice(0, 10);

  const { error: deleteError } = await service
    .from("crew_assignments")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (ids.length > 0) {
    const rows = ids.map((user_id) => ({
      project_id: projectId,
      user_id,
      assigned_by: assignedBy,
      job_date: jobDate,
    }));
    const { error: insertError } = await service.from("crew_assignments").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
