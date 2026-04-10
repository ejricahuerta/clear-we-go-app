import { createClient } from "@/lib/supabase/server";
import { isAutoSidebarImportantStage } from "@/lib/projects/stages";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown> & {
  clients?: { first_name: string; last_name: string }[] | { first_name: string; last_name: string } | null;
};

type MappedProject = {
  id: string;
  property_address: string;
  neighbourhood: string | null;
  stage: string;
  job_date: string | null;
  pinned: boolean;
  client_name: string | null;
};

function mapRow(p: Row): MappedProject {
  const { clients, ...rest } = p;
  const client = Array.isArray(clients) ? clients[0] : clients;
  const r = rest as Omit<MappedProject, "client_name">;
  return {
    ...r,
    pinned: Boolean(r.pinned),
    client_name: client ? `${client.first_name} ${client.last_name}` : null,
  };
}

function byJobDateDesc(a: MappedProject, b: MappedProject) {
  if (a.job_date == null && b.job_date == null) return 0;
  if (a.job_date == null) return 1;
  if (b.job_date == null) return -1;
  return b.job_date.localeCompare(a.job_date);
}

/** Active pipeline: not archived, not closed — same notion as work still in flight. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("projects")
    .select(
      `
      id, property_address, neighbourhood, stage, job_date, pinned,
      clients!inner(first_name, last_name, archived_at)
    `
    )
    .is("archived_at", null)
    .neq("stage", "closed")
    .filter("clients.archived_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (rows ?? []).map((r) => mapRow(r as Row));
  const sidebarImportant = (p: MappedProject) => p.pinned || isAutoSidebarImportantStage(p.stage);
  const important = mapped.filter(sidebarImportant).sort(byJobDateDesc);
  const active = mapped.filter((p) => !sidebarImportant(p)).sort(byJobDateDesc);

  return NextResponse.json({ important, active });
}
