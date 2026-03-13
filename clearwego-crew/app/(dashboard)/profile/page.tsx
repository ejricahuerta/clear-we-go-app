"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("name, email")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) {
        setName((profile as { name: string | null }).name ?? "");
        setEmail((profile as { email: string | null }).email ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Account and preferences</p>
        <p className="text-muted-foreground mt-6 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Profile</h1>
      <p className="text-muted-foreground mt-1 text-sm">Account and preferences</p>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 text-card-foreground space-y-3">
        <p className="text-sm text-muted-foreground">Name</p>
        <p className="text-base font-medium text-foreground">{name || "—"}</p>
        <p className="text-sm text-muted-foreground mt-2">Email</p>
        <p className="text-base font-medium text-foreground">{email || "—"}</p>
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Change password and notification preferences will be added in a later phase.
      </p>

      <Button
        variant="outline"
        className="mt-6 min-h-[44px] w-full"
        onClick={signOut}
      >
        Sign out
      </Button>
    </div>
  );
}
