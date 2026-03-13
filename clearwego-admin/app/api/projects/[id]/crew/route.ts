import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const CREW_APP_URL = process.env.CREW_APP_URL ?? "https://crew.clearwego.ca";
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function getDayOfWeek(dateStr: string | null): (typeof DAY_NAMES)[number] | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
}

/** Uses public.crew_assignments, crew_availability, crew_unavailable_dates. */

/** GET: list crew assigned to this project + all assignable crew with availability for job_date. */
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
    .select("id, job_date, service_type, property_address")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const jobDate = (project as { job_date?: string }).job_date ?? null;
  const dayOfWeek = getDayOfWeek(jobDate);

  const crewResult = await service.from("users").select("id, name, email").eq("role", "crew");
  const crewList = crewResult.data ?? [];

  const assignedIds = new Set<string>();
  const { data: assignments } = await service
    .from("crew_assignments")
    .select("user_id")
    .eq("project_id", projectId);
  (assignments ?? []).forEach((r: { user_id: string }) => assignedIds.add(r.user_id));

  const userIds = crewList.map((u: { id: string }) => u.id);

  const [weeklyRows, unavailableRows, otherAssignments] = await Promise.all([
    dayOfWeek
      ? service.from("crew_availability").select("user_id, available").eq("day_of_week", dayOfWeek).in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; available: boolean }[] }),
    jobDate
      ? service.from("crew_unavailable_dates").select("user_id, reason").eq("date", jobDate).in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; reason: string }[] }),
    jobDate
      ? service.from("crew_assignments").select("user_id").eq("job_date", jobDate).neq("project_id", projectId).in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
  ]);

  const weeklyByUser = new Map<string, boolean>();
  (weeklyRows.data ?? []).forEach((r: { user_id: string; available: boolean }) => weeklyByUser.set(r.user_id, r.available));
  const unavailableByUser = new Map<string, string>();
  (unavailableRows.data ?? []).forEach((r: { user_id: string; reason: string }) => unavailableByUser.set(r.user_id, r.reason ?? "other"));
  const otherProjectByUser = new Set<string>((otherAssignments.data ?? []).map((r: { user_id: string }) => r.user_id));

  const dayLabel = dayOfWeek ? dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1) : "";

  const allCrew = crewList.map((u: { id: string; name: string | null; email: string | null }) => {
    const assigned = assignedIds.has(u.id);
    let available = true;
    let unavailableReason: string | undefined;
    if (dayOfWeek) {
      const weekly = weeklyByUser.get(u.id);
      if (weekly !== true) {
        available = false;
        unavailableReason = weekly === false ? `Not available on ${dayLabel}` : `Schedule not set for ${dayLabel}`;
      }
    }
    if (unavailableByUser.has(u.id)) {
      available = false;
      const reason = unavailableByUser.get(u.id) ?? "other";
      unavailableReason = `Marked unavailable (${reason})`;
    }
    if (otherProjectByUser.has(u.id)) {
      available = false;
      unavailableReason = "Already assigned to another project on this date";
    }
    return {
      id: u.id,
      name: u.name ?? "",
      email: u.email ?? "",
      assigned,
      available,
      unavailableReason,
    };
  });

  return NextResponse.json({
    crew: allCrew.filter((u) => u.assigned),
    available: allCrew.filter((u) => !u.assigned && u.available),
    unavailable: allCrew.filter((u) => !u.assigned && !u.available),
    all: allCrew,
    job_date: jobDate,
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
    .select("id, job_date, start_time, service_type, property_address")
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
    const rows = ids.map((user_id: string) => ({
      project_id: projectId,
      user_id,
      assigned_by: assignedBy,
      job_date: jobDate,
    }));
    const { error: insertError } = await service.from("crew_assignments").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const proj = project as { service_type?: string; property_address?: string; start_time?: string };
      const serviceLabel = (proj.service_type ?? "").replace(/_/g, " ");
      const dateLabel = jobDate ? new Date(jobDate + "T12:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric", year: "numeric" }) : "";
      const timeLabel = proj.start_time ?? "TBD";
      const fromAddress = process.env.RESEND_FROM ?? "Clear We Go <noreply@clearwego.ca>";
      const resend = new Resend(apiKey);
      const { data: crewUsers } = await service.from("users").select("id, name, email").in("id", ids);
      for (const u of crewUsers ?? []) {
        const email = (u as { email?: string }).email;
        if (!email) continue;
        const firstName = ((u as { name?: string }).name ?? "").split(/\s+/)[0] || "there";
        await resend.emails.send({
          from: fromAddress,
          to: [email],
          subject: "New job assigned – Clear We Go",
          html: `
            <p>Hi ${firstName},</p>
            <p>You've been assigned to a job.</p>
            <p><strong>${serviceLabel}</strong><br/>${dateLabel} at ${timeLabel}<br/>${(proj.property_address ?? "").trim() || "—"}</p>
            <p><a href="${CREW_APP_URL}" style="display:inline-block; padding: 12px 24px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px;">Open crew app</a></p>
            <p>Clear We Go</p>
          `,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
