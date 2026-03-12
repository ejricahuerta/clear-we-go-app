import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ACCESS_TYPES = ["key", "lockbox", "owner_present", "realtor_lockbox", "building_fob"] as const;

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

  const { data: rows, error } = await supabase
    .from("project_access")
    .select("*")
    .eq("project_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ access: rows?.[0] ?? null });
}

export async function PUT(
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
  const access_type = body?.access_type && ACCESS_TYPES.includes(body.access_type) ? body.access_type : null;
  const payload = {
    project_id: id,
    access_type: access_type ?? null,
    received_from: body?.received_from?.trim() || null,
    received_date: body?.received_date || null,
    lockbox_code: body?.lockbox_code?.trim() || null,
    building_instructions: body?.building_instructions?.trim() || null,
    parking_instructions: body?.parking_instructions?.trim() || null,
    key_returned_to: body?.key_returned_to?.trim() || null,
    key_returned_date: body?.key_returned_date || null,
  };

  const { data: existing } = await supabase
    .from("project_access")
    .select("id")
    .eq("project_id", id)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("project_access")
      .update(payload)
      .eq("project_id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  } else {
    const { error: insertError } = await supabase.from("project_access").insert(payload);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
