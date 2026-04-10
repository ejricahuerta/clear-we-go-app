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

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, service_type, property_address, neighbourhood, stage, quote_amount, invoice_amount, payment_received, job_date, created_at, archived_at"
    )
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRevenue = (projects ?? []).reduce(
    (sum, p) => sum + (p.payment_received && p.invoice_amount ? Number(p.invoice_amount) : 0),
    0
  );

  return NextResponse.json({ projects: projects ?? [], totalRevenue });
}
