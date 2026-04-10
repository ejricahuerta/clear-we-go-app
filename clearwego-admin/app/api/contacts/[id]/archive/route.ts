import { createClient } from "@/lib/supabase/server";
import { markContactArchivedAndUnlink } from "@/lib/clients/create-from-contact";
import { NextResponse } from "next/server";

export async function POST(
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

  const { data: contact, error: fetchError } = await supabase.from("contacts").select("id").eq("id", id).single();

  if (fetchError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await markContactArchivedAndUnlink(supabase, id);

  const { data: updated, error: updError } = await supabase.from("contacts").select("*").eq("id", id).single();

  if (updError || !updated) {
    return NextResponse.json({ error: updError?.message ?? "Failed to archive contact" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
