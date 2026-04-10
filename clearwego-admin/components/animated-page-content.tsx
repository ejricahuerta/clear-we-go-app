"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Full-width doc-style pages manage their own horizontal padding (e.g. project detail). */
const FULL_BLEED_PATH = /^\/projects\/[^/]+$/;

export function AnimatedPageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED_PATH.test(pathname);
  return (
    <div
      key={pathname}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden",
        fullBleed
          ? "overflow-y-auto p-0 lg:overflow-y-hidden"
          : "overflow-y-auto gap-4 p-3 md:p-4"
      )}
    >
      {children}
    </div>
  );
}
