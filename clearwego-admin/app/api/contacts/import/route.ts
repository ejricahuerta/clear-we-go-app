import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_TYPES = ["estate_lawyer", "realtor", "property_manager", "other"] as const;
const VALID_FOUND_VIA = ["apollo", "linkedin", "realtor_ca", "lsoo", "referral", "other"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rows = body?.rows as Array<{
    first_name: string;
    last_name: string;
    company?: string;
    type?: string;
    email?: string;
    phone?: string;
    neighbourhood?: string;
    found_via?: string;
  }> | undefined;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  const toInsert = rows.map((r) => ({
    first_name: String(r.first_name ?? "Unknown").trim(),
    last_name: String(r.last_name ?? "").trim(),
    company: r.company?.trim() || null,
    type: (VALID_TYPES as readonly string[]).includes(r.type ?? "") ? r.type : "other",
    email: r.email?.trim() || null,
    phone: r.phone?.trim() || null,
    neighbourhood: r.neighbourhood?.trim() || null,
    found_via: (VALID_FOUND_VIA as readonly string[]).includes(r.found_via ?? "") ? r.found_via : "apollo",
    status: "new",
  }));

  const { error } = await supabase.from("contacts").insert(toInsert);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: toInsert.length });
}
