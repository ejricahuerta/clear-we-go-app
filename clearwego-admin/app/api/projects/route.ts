import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const STAGES = [
  "inquiry", "walkthrough_booked", "quoted", "deposit_received",
  "scheduled", "in_progress", "cleared", "report_sent", "review_requested", "closed",
] as const;
const SERVICE_TYPES = ["estate_cleanout", "presale_clearout", "tenant_moveout", "downsizing"] as const;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const stage = searchParams.get("stage");
  const serviceType = searchParams.get("service_type");
  const neighbourhood = searchParams.get("neighbourhood");
  const search = searchParams.get("search")?.trim() ?? "";
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabase
    .from("projects")
    .select(`
      id, client_id, service_type, property_size, property_address, neighbourhood,
      stage, walkthrough_date, job_date, start_time, quote_amount, invoice_amount, payment_received,
      created_at,
      clients!inner(first_name, last_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);
  if (stage && STAGES.includes(stage as (typeof STAGES)[number])) query = query.eq("stage", stage);
  if (serviceType && SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])) {
    query = query.eq("service_type", serviceType);
  }
  if (neighbourhood) query = query.ilike("neighbourhood", `%${neighbourhood}%`);
  if (dateFrom) query = query.gte("job_date", dateFrom);
  if (dateTo) query = query.lte("job_date", dateTo);
  if (search) {
    query = query.or(`property_address.ilike.%${search}%`);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") ?? "50", 10)));
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projects = (rows ?? []).map((p: { clients?: { first_name: string; last_name: string } | null } & Record<string, unknown>) => {
    const { clients, ...rest } = p;
    const client = Array.isArray(clients) ? clients[0] : clients;
    return {
      ...rest,
      client_name: client ? `${client.first_name} ${client.last_name}` : null,
    };
  });

  return NextResponse.json({ projects, total: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
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
  const client_id = body?.client_id;
  const service_type = body?.service_type;
  const property_address = body?.property_address?.trim();

  if (!client_id || !service_type || !property_address) {
    return NextResponse.json({ error: "client_id, service_type, and property_address required" }, { status: 400 });
  }
  if (!SERVICE_TYPES.includes(service_type)) {
    return NextResponse.json({ error: "Invalid service_type" }, { status: 400 });
  }

  const insert: Record<string, unknown> = {
    client_id,
    service_type,
    property_address,
    neighbourhood: body?.neighbourhood?.trim() || null,
    property_size: body?.property_size || null,
    stage: "inquiry",
  };

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert(insert)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id,
    project_id: project.id,
    event_type: "project_created",
    event_category: "project",
    event_description: `Project created by ${profile.name}: ${service_type.replace(/_/g, " ")} at ${property_address}`,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
  });
  if (timelineError) {
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  return NextResponse.json({ ...project, client_id, service_type, property_address, stage: "inquiry" });
}
