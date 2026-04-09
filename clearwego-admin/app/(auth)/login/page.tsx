"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Detect in-app browsers (e.g. Messenger, Instagram) where Google blocks OAuth (403 disallowed_useragent). */
function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  const ua = navigator.userAgent.toLowerCase();
  const inAppPatterns = [
    "fbav", "fban", "facebook", "messenger", "instagram", "line/", "twitter", "snapchat",
    "webview", "; wv)", "; wv;",
  ];
  return inAppPatterns.some((p) => ua.includes(p));
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOpenInBrowser, setShowOpenInBrowser] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.refresh();
      // Use canonical app URL so redirect stays on production (e.g. admin.clearwego.ca), not localhost
      const base =
        typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
          ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
          : typeof window !== "undefined"
            ? window.location.origin
            : "";
      if (base) window.location.href = `${base}/`;
      else router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setShowOpenInBrowser(false);
    if (isLikelyInAppBrowser()) {
      setShowOpenInBrowser(true);
      return;
    }
    const supabase = createClient();
    const base =
      typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
        : typeof window !== "undefined"
          ? window.location.origin
          : "";
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${base}/auth/callback` },
    });
    if (err) setError(err.message);
  }

  function copyLoginLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image src="/icons/logo.png" alt="Clear We Go" width={80} height={80} className="object-contain" priority />
        </div>
        <h1 className="text-xl font-semibold text-center">Clear We Go - Admin</h1>
        <p className="text-sm text-muted-foreground text-center">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Signing in…" : "Sign in with email"}
          </Button>
        </form>

        <div className="relative">
          <span className="block text-center text-xs text-muted-foreground">or</span>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
          Sign in with Google
        </Button>

        {showOpenInBrowser && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Google sign-in doesn&apos;t work in this browser
            </p>
            <p className="text-muted-foreground">
              Open this page in <strong>Safari</strong> or <strong>Chrome</strong> and try &quot;Sign in with Google&quot; again.
            </p>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={copyLoginLink}>
                Copy login link
              </Button>
              <p className="text-xs text-muted-foreground break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
