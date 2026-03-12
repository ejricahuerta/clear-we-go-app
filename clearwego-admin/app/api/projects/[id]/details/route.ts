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

  const { data: rows, error } = await supabase
    .from("project_details")
    .select("field_key, field_value")
    .eq("project_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const details = (rows ?? []).reduce((acc, r) => {
    acc[r.field_key] = r.field_value;
    return acc;
  }, {} as Record<string, string | null>);

  return NextResponse.json({ details });
}

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
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be an object of field_key: value" }, { status: 400 });
  }

  for (const [key, value] of Object.entries(body)) {
    const fieldKey = String(key).trim();
    if (!fieldKey) continue;
    const fieldValue = value === null || value === undefined ? null : String(value);
    const { error: upsertError } = await supabase
      .from("project_details")
      .upsert({ project_id: id, field_key: fieldKey, field_value: fieldValue }, { onConflict: "project_id,field_key" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
