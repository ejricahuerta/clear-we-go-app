import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json(contact);
}

const ALLOWED_KEYS = [
  "first_name", "last_name", "company", "type", "email", "phone", "neighbourhood",
  "found_via", "status", "response_received", "response_notes", "notes",
] as const;

const ALLOWED_STATUSES = ["new", "contacted", "responded", "client", "archived", "reopened"] as const;

export async function PATCH(
  request: Request,
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

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (body && typeof body === "object" && "archived_at" in body && (body as { archived_at?: unknown }).archived_at === null) {
    updates.archived_at = null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (updates.status !== undefined) {
    const s = updates.status;
    if (typeof s !== "string" || !ALLOWED_STATUSES.includes(s as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
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

  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("id, client_id")
    .eq("id", id)
    .single();

  if (fetchError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact.client_id) {
    const { error: clientDelError } = await supabase.rpc("delete_client_permanently", {
      p_client_id: contact.client_id,
    });
    if (clientDelError) {
      const forbidden =
        clientDelError.code === "42501" ||
        clientDelError.message?.toLowerCase().includes("not allowed") ||
        clientDelError.message?.toLowerCase().includes("permission denied");
      return NextResponse.json({ error: clientDelError.message }, { status: forbidden ? 403 : 500 });
    }
  }

  const { error: delError } = await supabase.from("contacts").delete().eq("id", id);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
