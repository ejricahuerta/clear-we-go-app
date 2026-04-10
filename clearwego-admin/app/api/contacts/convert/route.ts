import { createClient } from "@/lib/supabase/server";
import { convertContactToClient } from "@/lib/clients/create-from-contact";
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

  const result = await convertContactToClient(supabase, contactId, profile);
  if ("error" in result) {
    const status = result.error === "Contact not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, clientId: result.clientId });
}
