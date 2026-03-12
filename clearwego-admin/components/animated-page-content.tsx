"use client";

import { usePathname } from "next/navigation";

export function AnimatedPageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-3 md:p-4"
    >
      {children}
    </div>
  );
}
