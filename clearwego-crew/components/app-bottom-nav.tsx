"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Today" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/availability", label: "Availability" },
  { href: "/profile", label: "Profile" },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-pb flex items-center justify-around h-14 max-w-md mx-auto">
      {nav.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors min-h-[44px]",
            pathname === href
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
