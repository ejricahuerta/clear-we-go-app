import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("auth_user_id", authUser.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  return NextResponse.json(profile);
}
