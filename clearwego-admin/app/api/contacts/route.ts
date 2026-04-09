import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CONTACT_STATUSES = ["new", "contacted", "responded", "converted", "dead"] as const;
const CONTACT_TYPES = ["estate_lawyer", "realtor", "property_manager", "other"] as const;
const FOUND_VIA = ["apollo", "linkedin", "realtor_ca", "lsoo", "referral", "other"] as const;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "all"; // all | follow_up | no_response | responded
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const neighbourhood = searchParams.get("neighbourhood");
  const foundVia = searchParams.get("found_via");
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "created_at";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, company, type, email, phone, neighbourhood, found_via, status, email_1_sent, email_2_sent, email_3_sent, last_contacted_date, follow_up_date, converted_to_client, created_at", { count: "exact" });

  if (view === "follow_up") {
    query = query.eq("follow_up_date", new Date().toISOString().slice(0, 10)).in("status", ["new", "contacted"]);
  } else if (view === "no_response") {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    query = query
      .eq("email_1_sent", true)
      .in("status", ["new", "contacted"])
      .or(`last_contacted_date.lte.${fiveDaysAgo},last_contacted_date.is.null`);
  } else if (view === "responded") {
    query = query.eq("status", "responded").eq("converted_to_client", false);
  }

  if (status && CONTACT_STATUSES.includes(status as (typeof CONTACT_STATUSES)[number])) {
    query = query.eq("status", status);
  }
  if (type && CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) {
    query = query.eq("type", type);
  }
  if (neighbourhood) {
    query = query.ilike("neighbourhood", `%${neighbourhood}%`);
  }
  if (foundVia && FOUND_VIA.includes(foundVia as (typeof FOUND_VIA)[number])) {
    query = query.eq("found_via", foundVia);
  }
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const sortColumn = ["created_at", "last_contacted_date", "follow_up_date", "first_name"].includes(sort) ? sort : "created_at";
  query = query.order(sortColumn, { ascending: order === "asc" });

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data: contacts, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: contacts ?? [], total: count ?? 0, page, pageSize });
}
const CONTACT_SELECT =
  "id, first_name, last_name, company, type, email, phone, neighbourhood, found_via, status, email_1_sent, email_2_sent, email_3_sent, last_contacted_date, follow_up_date, converted_to_client, created_at";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const firstName = String(b.first_name ?? "").trim();
  if (!firstName) {
    return NextResponse.json({ error: "first_name is required" }, { status: 400 });
  }

  const lastName = String(b.last_name ?? "").trim();
  const typeRaw = String(b.type ?? "");
  const foundViaRaw = String(b.found_via ?? "");

  const row = {
    first_name: firstName,
    last_name: lastName,
    company: typeof b.company === "string" ? b.company.trim() || null : null,
    type: CONTACT_TYPES.includes(typeRaw as (typeof CONTACT_TYPES)[number]) ? typeRaw : "other",
    email: typeof b.email === "string" ? b.email.trim() || null : null,
    phone: typeof b.phone === "string" ? b.phone.trim() || null : null,
    neighbourhood: typeof b.neighbourhood === "string" ? b.neighbourhood.trim() || null : null,
    found_via: FOUND_VIA.includes(foundViaRaw as (typeof FOUND_VIA)[number]) ? foundViaRaw : "apollo",
    status: "new" as const,
  };

  const { data: contact, error } = await supabase.from("contacts").insert(row).select(CONTACT_SELECT).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact });
}
