import { createClient } from "@/lib/supabase/server";
import {
  convertContactToClient,
  findContactDuplicates,
  normalizeEmail,
  normalizePhoneDigits,
  type ClientFieldOverrides,
} from "@/lib/clients/create-from-contact";
import { NextResponse } from "next/server";

const CONTACT_TYPES = ["estate_lawyer", "realtor", "property_manager", "other"] as const;
const FOUND_VIA = ["apollo", "linkedin", "realtor_ca", "lsoo", "quo", "referral", "other"] as const;

const CONTACT_INSERT_SELECT =
  "id, first_name, last_name, company, type, email, phone, neighbourhood, found_via, status, email_1_sent, email_2_sent, email_3_sent, last_contacted_date, follow_up_date, converted_to_client, created_at";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, phone, neighbourhood, referral_source, status, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: clients ?? [] });
}

export async function POST(request: Request) {
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

  const existingContactId = typeof b.existing_contact_id === "string" ? b.existing_contact_id.trim() : "";
  const forceNewContact = Boolean(b.force_new_contact);

  if (existingContactId) {
    const overrides: ClientFieldOverrides = {};
    if (typeof b.first_name === "string" && b.first_name.trim()) {
      overrides.first_name = b.first_name.trim();
    }
    if (typeof b.last_name === "string" && b.last_name.trim()) {
      overrides.last_name = b.last_name.trim();
    }
    if (typeof b.email === "string") {
      overrides.email = b.email.trim() || null;
    }
    if (typeof b.phone === "string") {
      overrides.phone = b.phone.trim() || null;
    }
    if (typeof b.neighbourhood === "string") {
      overrides.neighbourhood = b.neighbourhood.trim() || null;
    }
    if (typeof b.address === "string") {
      overrides.address = b.address.trim() || null;
    }
    if (typeof b.client_type === "string" && b.client_type.trim()) {
      overrides.client_type = b.client_type.trim();
    }
    if (typeof b.referral_source === "string") {
      overrides.referral_source = b.referral_source.trim() || null;
    }
    if (typeof b.sms_opted_out === "boolean") {
      overrides.sms_opted_out = b.sms_opted_out;
    }
    if (typeof b.google_review_received === "boolean") {
      overrides.google_review_received = b.google_review_received;
    }
    if (typeof b.notes === "string") {
      overrides.notes = b.notes.trim() || null;
    }

    const result = await convertContactToClient(supabase, existingContactId, profile, overrides);
    if ("error" in result) {
      const status = result.error === "Contact not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, clientId: result.clientId });
  }

  const firstName = String(b.first_name ?? "").trim();
  if (!firstName) {
    return NextResponse.json({ error: "first_name is required" }, { status: 400 });
  }

  const lastName = String(b.last_name ?? "").trim();
  const typeRaw = String(b.type ?? "other");
  const foundViaRaw = String(b.found_via ?? b.referral_source ?? "apollo");
  const emailStr = typeof b.email === "string" ? b.email.trim() || null : null;
  const phoneStr = typeof b.phone === "string" ? b.phone.trim() || null : null;
  const neighbourhoodStr = typeof b.neighbourhood === "string" ? b.neighbourhood.trim() || null : null;
  const companyStr = typeof b.company === "string" ? b.company.trim() || null : null;

  const overrides: ClientFieldOverrides = {
    first_name: firstName,
    last_name: lastName,
    email: emailStr,
    phone: phoneStr,
    neighbourhood: neighbourhoodStr,
    address: typeof b.address === "string" ? b.address.trim() || null : null,
    sms_opted_out: typeof b.sms_opted_out === "boolean" ? b.sms_opted_out : false,
    google_review_received: typeof b.google_review_received === "boolean" ? b.google_review_received : false,
    notes: typeof b.notes === "string" ? b.notes.trim() || null : null,
  };
  if (typeof b.client_type === "string" && b.client_type.trim()) {
    overrides.client_type = b.client_type.trim();
  }
  if (typeof b.referral_source === "string") {
    overrides.referral_source = b.referral_source.trim() || null;
  }

  const emailNorm = normalizeEmail(emailStr);
  const phoneDigits = normalizePhoneDigits(phoneStr);
  const hasDuplicateSignal = emailNorm != null || (phoneStr != null && phoneStr.length > 0) || phoneDigits.length >= 10;

  if (!forceNewContact && hasDuplicateSignal) {
    const candidates = await findContactDuplicates(supabase, emailNorm, phoneStr);
    if (candidates.length > 0) {
      return NextResponse.json({
        needsConfirmation: true,
        candidates: candidates.map((c) => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
        })),
      });
    }
  }

  const foundVia = FOUND_VIA.includes(foundViaRaw as (typeof FOUND_VIA)[number]) ? foundViaRaw : "apollo";
  const contactRow = {
    first_name: firstName,
    last_name: lastName,
    company: companyStr,
    type: CONTACT_TYPES.includes(typeRaw as (typeof CONTACT_TYPES)[number]) ? typeRaw : "other",
    email: emailStr,
    phone: phoneStr,
    neighbourhood: neighbourhoodStr,
    found_via: foundVia,
    status: "new" as const,
  };

  const { data: contact, error: insertErr } = await supabase
    .from("contacts")
    .insert(contactRow)
    .select(CONTACT_INSERT_SELECT)
    .single();

  if (insertErr || !contact) {
    return NextResponse.json({ error: insertErr?.message ?? "Failed to create contact" }, { status: 500 });
  }

  const result = await convertContactToClient(supabase, contact.id, profile, overrides);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clientId: result.clientId });
}
