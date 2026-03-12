import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rows = body?.rows as Array<{ email?: string; phone?: string }> | undefined;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  const emails = [...new Set(rows.map((r) => (r.email ?? "").toLowerCase().trim()).filter(Boolean))];
  const phones = [...new Set(rows.map((r) => (r.phone ?? "").trim()).filter(Boolean))];

  let existingEmails = new Set<string>();
  if (emails.length > 0) {
    const { data } = await supabase.from("contacts").select("email").in("email", emails);
    existingEmails = new Set((data ?? []).map((r) => (r.email ?? "").toLowerCase()));
  }
  let existingPhones = new Set<string>();
  if (phones.length > 0) {
    const { data } = await supabase.from("contacts").select("phone").in("phone", phones);
    existingPhones = new Set((data ?? []).map((r) => (r.phone ?? "").trim()));
  }

  const rowsWithDup: Array<Record<string, unknown> & { duplicate?: string }> = rows.map((r) => {
    const email = (r.email ?? "").toLowerCase().trim();
    const phone = (r.phone ?? "").trim();
    const hasEmail = existingEmails.has(email);
    const hasPhone = phone && existingPhones.has(phone);
    let duplicate: string | undefined;
    if (hasEmail && hasPhone) duplicate = "both";
    else if (hasEmail) duplicate = "email";
    else if (hasPhone) duplicate = "phone";
    return { ...r, duplicate };
  });

  const duplicateCount = rowsWithDup.filter((r) => r.duplicate).length;

  return NextResponse.json({ rows: rowsWithDup, duplicateCount });
}
