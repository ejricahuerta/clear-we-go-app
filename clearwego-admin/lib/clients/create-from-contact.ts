import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminProfile = { id: string; name: string; role: string };

export type ClientFieldOverrides = Partial<{
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  neighbourhood: string | null;
  address: string | null;
  client_type: string | null;
  referral_source: string | null;
  sms_opted_out: boolean;
  google_review_received: boolean;
  notes: string | null;
}>;

/** Mark contacts as archived and clear client link (used before hard delete and when archiving a client). */
export async function unlinkContactsFromClient(supabase: SupabaseClient, clientId: string) {
  await supabase
    .from("contacts")
    .update({
      status: "archived",
      client_id: null,
      converted_to_client: false,
      archived_at: null,
    })
    .eq("client_id", clientId);

  const { data: client } = await supabase.from("clients").select("contact_id").eq("id", clientId).maybeSingle();

  if (client?.contact_id) {
    await supabase
      .from("contacts")
      .update({
        status: "archived",
        client_id: null,
        converted_to_client: false,
        archived_at: null,
      })
      .eq("id", client.contact_id);
  }
}

/** Set contact to archived, unlink from client, clear clients.contact_id when it points here. */
export async function markContactArchivedAndUnlink(supabase: SupabaseClient, contactId: string) {
  const { data: contact } = await supabase.from("contacts").select("client_id").eq("id", contactId).maybeSingle();
  const clientId = contact?.client_id ?? null;

  await supabase.from("clients").update({ contact_id: null }).eq("contact_id", contactId);

  await supabase
    .from("contacts")
    .update({
      status: "archived",
      client_id: null,
      converted_to_client: false,
      archived_at: null,
    })
    .eq("id", contactId);

  if (clientId) {
    await supabase.from("clients").update({ contact_id: null }).eq("id", clientId).eq("contact_id", contactId);
  }
}

export async function convertContactToClient(
  supabase: SupabaseClient,
  contactId: string,
  profile: AdminProfile,
  overrides?: ClientFieldOverrides
): Promise<{ clientId: string } | { error: string }> {
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, neighbourhood, found_via, converted_to_client, client_id, status")
    .eq("id", contactId)
    .single();

  if (contactError || !contact) {
    return { error: "Contact not found" };
  }

  if (contact.status === "archived") {
    return { error: "Change status from Archived before converting to a client." };
  }

  if (contact.converted_to_client && contact.client_id) {
    const { data: linked } = await supabase
      .from("clients")
      .select("id, archived_at")
      .eq("id", contact.client_id)
      .maybeSingle();
    if (linked && linked.archived_at == null) {
      return { error: "This contact is already linked to an active client." };
    }
  }

  const referral =
    overrides?.referral_source === undefined
      ? contact.found_via != null
        ? String(contact.found_via)
        : null
      : overrides.referral_source;

  const insertRow = {
    status: "inquiry" as const,
    first_name: overrides?.first_name ?? contact.first_name,
    last_name: overrides?.last_name ?? contact.last_name,
    email: overrides?.email !== undefined ? overrides.email : contact.email ?? null,
    phone: overrides?.phone !== undefined ? overrides.phone : contact.phone ?? null,
    neighbourhood: overrides?.neighbourhood !== undefined ? overrides.neighbourhood : contact.neighbourhood ?? null,
    address: overrides?.address !== undefined ? overrides.address : null,
    client_type: overrides?.client_type !== undefined ? overrides.client_type : null,
    referral_source: referral,
    sms_opted_out: overrides?.sms_opted_out ?? false,
    google_review_received: overrides?.google_review_received ?? false,
    notes: overrides?.notes !== undefined ? overrides.notes : null,
    contact_id: contactId,
  };

  const { data: newClient, error: clientError } = await supabase.from("clients").insert(insertRow).select("id").single();

  if (clientError || !newClient) {
    return { error: clientError?.message ?? "Failed to create client" };
  }

  const { error: updateContactError } = await supabase
    .from("contacts")
    .update({
      client_id: newClient.id,
      converted_to_client: true,
      status: "client",
    })
    .eq("id", contactId);

  if (updateContactError) {
    await supabase.from("clients").delete().eq("id", newClient.id);
    return { error: updateContactError.message };
  }

  const sourceLabel = contact.found_via ? String(contact.found_via).replace(/_/g, " ") : "unknown";
  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id: newClient.id,
    event_type: "contact_converted",
    event_category: "contact",
    event_description: `Converted from contact - originally found via ${sourceLabel}`,
    created_by_id: profile.id,
    created_by_name: profile.name,
    created_by_role: profile.role,
  });

  if (timelineError) {
    return { error: timelineError.message };
  }

  return { clientId: newClient.id };
}

export function normalizeEmail(email: string | undefined | null): string | null {
  const t = String(email ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

export function normalizePhoneDigits(phone: string | undefined | null): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export type ContactCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

/** Match same email (case-insensitive) and/or same phone (exact string or same digits). */
export async function findContactDuplicates(
  supabase: SupabaseClient,
  emailNorm: string | null,
  phoneRaw: string | null
): Promise<ContactCandidate[]> {
  const map = new Map<string, ContactCandidate>();

  if (emailNorm) {
    const escaped = emailNorm.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const { data } = await supabase.from("contacts").select("id, first_name, last_name, email, phone").ilike("email", escaped);
    for (const c of data ?? []) {
      if (normalizeEmail(c.email) === emailNorm) {
        map.set(c.id, {
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
        });
      }
    }
  }

  const trimmed = String(phoneRaw ?? "").trim();
  if (trimmed) {
    const { data } = await supabase.from("contacts").select("id, first_name, last_name, email, phone").eq("phone", trimmed);
    for (const c of data ?? []) {
      map.set(c.id, {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
      });
    }
  }

  const digits = normalizePhoneDigits(phoneRaw);
  if (digits.length >= 10 && !emailNorm) {
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone")
      .not("phone", "is", null)
      .limit(2500);
    for (const c of data ?? []) {
      if (normalizePhoneDigits(c.phone) === digits) {
        map.set(c.id, {
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
        });
      }
    }
  }

  const out: ContactCandidate[] = [];
  map.forEach((v) => {
    out.push(v);
  });
  return out;
}
