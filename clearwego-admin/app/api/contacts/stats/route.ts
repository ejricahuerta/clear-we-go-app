import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: rows } = await supabase.from("contacts").select("status, found_via").gte("created_at", startOfMonth);

  const added = rows?.length ?? 0;
  const byStatus = (rows ?? []).reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const contactedCount =
    (byStatus.contacted ?? 0) +
    (byStatus.reopened ?? 0) +
    (byStatus.responded ?? 0) +
    (byStatus.client ?? 0);
  const responded = byStatus.responded ?? 0;
  const converted = byStatus.client ?? 0;
  const rate = added > 0 ? ((converted / added) * 100).toFixed(1) : "0";

  const bySource: Record<string, { added: number; responded: number; converted: number }> = {};
  for (const r of rows ?? []) {
    const src = r.found_via ?? "other";
    if (!bySource[src]) bySource[src] = { added: 0, responded: 0, converted: 0 };
    bySource[src].added += 1;
    if (r.status === "responded") bySource[src].responded += 1;
    if (r.status === "client") bySource[src].converted += 1;
  }

  return NextResponse.json({
    thisMonth: {
      added,
      contacted: contactedCount,
      responded,
      converted,
      rate: `${rate}%`,
    },
    bySource: Object.entries(bySource).map(([source, v]) => ({
      source,
      ...v,
      rate: v.added > 0 ? `${((v.converted / v.added) * 100).toFixed(1)}%` : "0%",
    })),
  });
}
