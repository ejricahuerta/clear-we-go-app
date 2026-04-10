import { createClient } from "@/lib/supabase/server";
import { insertProjectWithChecklist } from "@/lib/projects/insert-with-checklist";
import { PROJECT_STAGES } from "@/lib/projects/stages";
import { NextResponse } from "next/server";

const STAGES = PROJECT_STAGES;
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
      created_at, archived_at, pinned,
      clients!inner(first_name, last_name, archived_at)
    `, { count: "exact" })
    .is("archived_at", null)
    .filter("clients.archived_at", "is", null)
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

  type Row = Record<string, unknown> & { clients?: { first_name: string; last_name: string }[] | { first_name: string; last_name: string } | null };
  const projects = (rows ?? []).map((p: Row) => {
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

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, archived_at")
    .eq("id", client_id)
    .single();
  if (!clientRow) {
    return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }
  if (clientRow.archived_at != null) {
    return NextResponse.json({ error: "Cannot create a project for an archived client" }, { status: 400 });
  }

  const created = await insertProjectWithChecklist(
    supabase,
    {
      client_id,
      service_type,
      property_address,
      neighbourhood: body?.neighbourhood?.trim() || null,
      property_size: body?.property_size || null,
      stage: "todo",
      ...(typeof body?.quote_amount === "number" ? { quote_amount: body.quote_amount } : {}),
    },
    { id: profile.id, name: profile.name, role: profile.role }
  );

  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 500 });
  }

  return NextResponse.json({
    id: created.projectId,
    client_id,
    service_type,
    property_address,
    stage: "todo",
  });
}
