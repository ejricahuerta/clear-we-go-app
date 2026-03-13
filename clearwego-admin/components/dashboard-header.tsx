"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

const SEGMENTS: Record<string, string> = {
  "": "Home",
  contacts: "Contacts",
  clients: "Clients",
  projects: "Projects",
  team: "Team",
};

function displayName(user: User): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name && typeof name === "string") return name;
  if (user.email) return user.email;
  return "Signed in";
}

export function DashboardHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const second = segments[1];
  const label = SEGMENTS[first] ?? (first ? first.charAt(0).toUpperCase() + first.slice(1) : "Home");

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 md:h-16 md:px-4">
      <SidebarTrigger className="-ml-1 size-9 min-w-9 touch-manipulation md:size-7 md:min-w-7" aria-label="Open menu" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
      <Breadcrumb>
        <BreadcrumbList className="min-w-0">
          {!first && (
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate">Home</BreadcrumbPage>
            </BreadcrumbItem>
          )}
          {first && !second && (
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
          {first && second && (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href={"/" + first}>{label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">
                  {second === "new" ? "New" : second === "import" ? "Import" : "Details"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        {loading ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : user ? (
          <span className="truncate text-sm text-muted-foreground max-w-[180px] sm:max-w-[240px]" title={user.email ?? undefined}>
            {displayName(user)}
          </span>
        ) : null}
      </div>
    </header>
  );
}
