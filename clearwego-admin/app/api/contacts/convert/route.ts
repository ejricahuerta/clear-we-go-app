import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const body = await request.json();
  const contactId = body?.contactId ?? body?.contact_id;
  if (!contactId) {
    return NextResponse.json({ error: "contactId required" }, { status: 400 });
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, neighbourhood, found_via")
    .eq("id", contactId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact.found_via === undefined) (contact as { found_via?: string | null }).found_via = null;

  const { data: newClient, error: clientError } = await supabase
    .from("clients")
    .insert({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      neighbourhood: contact.neighbourhood ?? null,
      referral_source: contact.found_via ?? null,
      contact_id: contactId,
    })
    .select("id")
    .single();

  if (clientError || !newClient) {
    return NextResponse.json({ error: clientError?.message ?? "Failed to create client" }, { status: 500 });
  }

  const { error: updateContactError } = await supabase
    .from("contacts")
    .update({
      client_id: newClient.id,
      converted_to_client: true,
      status: "converted",
    })
    .eq("id", contactId);

  if (updateContactError) {
    return NextResponse.json({ error: updateContactError.message }, { status: 500 });
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
    return NextResponse.json({ error: timelineError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clientId: newClient.id });
}
