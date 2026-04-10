import { createClient } from "@/lib/supabase/server";
import { isClientStatus } from "@/lib/clients/status";
import { insertProjectWithChecklist, isServiceType } from "@/lib/projects/insert-with-checklist";
import { NextResponse } from "next/server";

const EDITABLE_KEYS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "neighbourhood",
  "client_type",
  "referral_source",
  "sms_opted_out",
  "google_review_received",
  "notes",
  "status",
  "quote_amount",
  "pending_property_address",
  "pending_service_type",
  "quo_contact_id",
] as const;

const FIELD_LABELS: Record<string, string> = {
  first_name: "Name",
  last_name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  neighbourhood: "Neighbourhood",
  client_type: "Client type",
  referral_source: "Referral source",
  sms_opted_out: "SMS preference",
  google_review_received: "Google review",
  notes: "Notes",
  status: "Funnel status",
  quote_amount: "Quote amount",
  pending_property_address: "Pending property address",
  pending_service_type: "Pending service type",
  quo_contact_id: "Quo contact id",
};

function clientUpdateTimelineDescription(changedFields: string[], profileName: string): string {
  const nonNotes = changedFields.filter((k) => k !== "notes");
  if (changedFields.length === 1 && changedFields[0] === "notes") {
    return `Notes updated by ${profileName}`;
  }
  if (nonNotes.length === 0) {
    return `Details updated by ${profileName}`;
  }
  if (nonNotes.length === 1) {
    const label = FIELD_LABELS[nonNotes[0]] ?? "Profile";
    return `${label} updated by ${profileName}`;
  }
  return `Profile updated by ${profileName}`;
}

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

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
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

  const { data: previous, error: prevError } = await supabase.from("clients").select("*").eq("id", id).single();
  if (prevError || !previous) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  for (const key of EDITABLE_KEYS) {
    if (body[key] === undefined) continue;
    if (key === "status") {
      const s = String(body.status ?? "").trim();
      if (!isClientStatus(s)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = s;
      continue;
    }
    if (key === "quote_amount") {
      if (body.quote_amount === null || body.quote_amount === "") {
        updates.quote_amount = null;
      } else {
        const n = Number(body.quote_amount);
        if (Number.isNaN(n)) {
          return NextResponse.json({ error: "Invalid quote_amount" }, { status: 400 });
        }
        updates.quote_amount = n;
      }
      continue;
    }
    if (key === "pending_service_type") {
      const v = body.pending_service_type;
      if (v === null || v === "") {
        updates.pending_service_type = null;
      } else if (isServiceType(String(v))) {
        updates.pending_service_type = String(v);
      } else {
        return NextResponse.json({ error: "Invalid pending_service_type" }, { status: 400 });
      }
      continue;
    }
    if (key === "pending_property_address" || key === "quo_contact_id") {
      const v = body[key];
      updates[key] = typeof v === "string" ? (v.trim() || null) : v === null ? null : v;
      continue;
    }
    updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: client, error: updateError } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const changedFields = Object.keys(updates);
  const eventDescription = clientUpdateTimelineDescription(changedFields, profile.name);
  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id: id,
    event_type: "client_updated",
    event_category: "client",
    event_description: eventDescription,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
    details: { updated_fields: changedFields },
  });
  if (timelineError) {
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  const oldStatus = String(previous.status ?? "inquiry");
  const newStatus = String(client.status ?? "inquiry");
  const transitionToDeposit = oldStatus !== "deposit_received" && newStatus === "deposit_received";

  const pendingAddr = typeof client.pending_property_address === "string" ? client.pending_property_address.trim() : "";
  const pendingComplete =
    Boolean(client.pending_service_type && isServiceType(String(client.pending_service_type))) && pendingAddr.length > 0;

  let responseClient = client;

  if (transitionToDeposit) {
    const pendingSvc = client.pending_service_type;
    if (pendingComplete && pendingSvc && isServiceType(pendingSvc)) {
      const created = await insertProjectWithChecklist(
        supabase,
        {
          client_id: id,
          service_type: pendingSvc,
          property_address: pendingAddr,
          neighbourhood: client.neighbourhood,
          ...(client.quote_amount != null && !Number.isNaN(Number(client.quote_amount))
            ? { quote_amount: Number(client.quote_amount) }
            : {}),
        },
        { id: profile.id, name: profile.name, role: profile.role }
      );
      if ("error" in created) {
        return NextResponse.json({ error: created.error }, { status: 500 });
      }
      const { data: afterDeposit, error: clearError } = await supabase
        .from("clients")
        .update({
          status: "active",
          pending_property_address: null,
          pending_service_type: null,
        })
        .eq("id", id)
        .select()
        .single();
      if (clearError || !afterDeposit) {
        return NextResponse.json({ error: clearError?.message ?? "Failed to update client after project creation" }, { status: 500 });
      }
      responseClient = afterDeposit;

      const { error: extraTl } = await supabase.from("timeline_events").insert({
        client_id: id,
        event_type: "client_deposit_project_created",
        event_category: "client",
        event_description: `Project auto-created from deposit by ${profile.name}`,
        created_by_id: profile.id,
        created_by_name: profile.name,
        created_by_role: profile.role,
        details: { project_id: created.projectId },
      });
      if (extraTl) {
        return NextResponse.json({ error: extraTl.message }, { status: 500 });
      }
    } else {
      const { error: depTl } = await supabase.from("timeline_events").insert({
        client_id: id,
        event_type: "client_deposit_pending_fields",
        event_category: "client",
        event_description: `Deposit received — add pending service type and property address on this client to auto-create a project (${profile.name})`,
        created_by_id: profile.id,
        created_by_name: profile.name,
        created_by_role: profile.role,
      });
      if (depTl) {
        return NextResponse.json({ error: depTl.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json(responseClient);
}

export async function DELETE(
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

  const { data: existing, error: fetchError } = await supabase.from("clients").select("id").eq("id", id).single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { error: rpcError } = await supabase.rpc("delete_client_permanently", { p_client_id: id });
  if (rpcError) {
    const forbidden =
      rpcError.code === "42501" ||
      rpcError.message?.toLowerCase().includes("not allowed") ||
      rpcError.message?.toLowerCase().includes("permission denied");
    return NextResponse.json({ error: rpcError.message }, { status: forbidden ? 403 : 500 });
  }

  return NextResponse.json({ ok: true });
}
