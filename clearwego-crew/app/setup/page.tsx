"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [expiredReason, setExpiredReason] = useState<string>("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setExpiredReason("Missing invite link.");
      setExpired(true);
      setLoading(false);
      return;
    }
    fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExpiredReason((data.message as string) || data.error || "Invalid or expired link.");
          setExpired(true);
          return;
        }
        if (data?.email) setInvite({ email: data.email, name: data.name });
        else setExpired(true);
      })
      .catch(() => {
        setExpiredReason("Could not verify link. Check that the crew app has the same Supabase env as the admin.");
        setExpired(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!invite?.email || !token) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: { full_name: invite.name, role: "crew" },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: invite.email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (expired || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold">Link expired</h1>
        <p className="text-muted-foreground mt-2">
          {expiredReason || "This link has expired. Contact your manager for a new invite."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full space-y-6">
        <h1 className="text-xl font-semibold text-center">Set up your account</h1>
        <p className="text-sm text-muted-foreground text-center">
          Hi {invite.name}, create a password to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <p className="text-sm text-muted-foreground">{invite.email}</p>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {submitting ? "Setting up…" : "Set up my account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
