import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizePhoneDigits } from "@/lib/clients/create-from-contact";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const OPENPHONE_BASE = "https://api.openphone.com";

function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function verifyQuoWebhook(request: Request): boolean {
  const secret = process.env.QUO_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const auth = (request.headers.get("authorization") ?? "").trim();
  const candidates = [secret, `Bearer ${secret}`, `bearer ${secret}`];
  return candidates.some((c) => timingSafeStringEqual(auth, c));
}

type CallSummaryPayload = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      callId?: string;
      status?: string;
      summary?: string[];
      nextSteps?: string[];
      contactIds?: string[];
    };
  };
};

async function fetchOpenPhoneJson<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const key = process.env.QUO_API_KEY?.trim();
  if (!key) return { ok: false, status: 500 };
  const res = await fetch(`${OPENPHONE_BASE}${path}`, {
    headers: { Authorization: key },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, status: res.status };
  const json = (await res.json()) as { data?: T };
  if (json.data === undefined) return { ok: false, status: 502 };
  return { ok: true, data: json.data };
}

type CallData = {
  direction?: string;
  participants?: string[];
};

type ContactData = {
  defaultPhoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function pickParticipantPhones(call: CallData): string[] {
  const parts = Array.isArray(call.participants) ? call.participants : [];
  return parts.filter((p): p is string => typeof p === "string" && /^\+[1-9]\d{1,14}$/.test(p));
}

function buildSummaryDescription(summary: string[], nextSteps: string[], contactName: string | null): string {
  const lines: string[] = [];
  if (contactName) lines.push(`Caller: ${contactName}`);
  if (summary?.length) lines.push("Summary:", ...summary.map((s) => `• ${s}`));
  if (nextSteps?.length) lines.push("Next steps:", ...nextSteps.map((s) => `• ${s}`));
  const text = lines.join("\n").trim() || "Call summary received (no text).";
  return text.length > 2000 ? `${text.slice(0, 1997)}...` : text;
}

export async function POST(request: Request) {
  if (!verifyQuoWebhook(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  let body: CallSummaryPayload;
  try {
    body = (await request.json()) as CallSummaryPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const type = String(body.type ?? "");
  if (type !== "callSummary") {
    return Response.json({ ok: true, ignored: true, reason: "event_type" });
  }

  const obj = body.data?.object;
  if (!obj || obj.status !== "completed") {
    return Response.json({ ok: true, ignored: true, reason: "summary_not_completed" });
  }

  const callId = obj.callId;
  if (!callId) {
    return Response.json({ ok: true, ignored: true, reason: "missing_call_id" });
  }

  const callRes = await fetchOpenPhoneJson<CallData>(`/v1/calls/${encodeURIComponent(callId)}`);
  if (!callRes.ok) {
    return Response.json({ ok: false, error: "call_lookup_failed", status: callRes.status });
  }

  const phones = pickParticipantPhones(callRes.data);
  let contactName: string | null = null;
  const firstContactId = obj.contactIds?.[0];
  if (firstContactId) {
    const cRes = await fetchOpenPhoneJson<ContactData>(`/v1/contacts/${encodeURIComponent(firstContactId)}`);
    if (cRes.ok) {
      const fn = [cRes.data.firstName, cRes.data.lastName].filter(Boolean).join(" ").trim();
      contactName = fn || null;
    }
  }

  const supabase = createServiceRoleClient();
  let clientId: string | null = null;
  for (const e164 of phones) {
    const digits = normalizePhoneDigits(e164);
    const { data: found, error } = await supabase.rpc("find_client_by_phone_digits", { p_digits: digits });
    if (!error && found) {
      clientId = found as string;
      break;
    }
  }

  if (!clientId) {
    return Response.json({ ok: true, skipped: true, reason: "no_client_match" });
  }

  const description = buildSummaryDescription(obj.summary ?? [], obj.nextSteps ?? [], contactName);
  const { error: tlErr } = await supabase.from("timeline_events").insert({
    client_id: clientId,
    event_type: "quo_call_summary",
    event_category: "communication",
    event_description: description,
    created_by_id: null,
    created_by_name: "Quo",
    created_by_role: "system",
    details: {
      call_id: callId,
      summary: obj.summary ?? [],
      next_steps: obj.nextSteps ?? [],
      contact_ids: obj.contactIds ?? [],
    },
  });
  if (tlErr) {
    return Response.json({ ok: false, error: tlErr.message }, { status: 500 });
  }

  const updates: Record<string, string | null> = {};
  if (firstContactId) {
    const { data: row } = await supabase.from("clients").select("quo_contact_id").eq("id", clientId).maybeSingle();
    if (row && (row as { quo_contact_id?: string | null }).quo_contact_id == null) {
      updates.quo_contact_id = firstContactId;
    }
  }

  if (Object.keys(updates).length) {
    await supabase.from("clients").update(updates).eq("id", clientId);
  }

  return Response.json({ ok: true, client_id: clientId });
}
