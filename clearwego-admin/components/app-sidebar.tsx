"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/team", label: "Team" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col min-h-screen">
      <div className="p-4 border-b border-border">
        <Link href="/" className="font-semibold text-foreground">
          Clear We Go
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
      </div>
      <nav className="p-2 flex-1">
        <ul className="space-y-0.5">
          {nav.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
