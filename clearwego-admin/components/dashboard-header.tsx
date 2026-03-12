"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const SEGMENTS: Record<string, string> = {
  "": "Home",
  contacts: "Contacts",
  clients: "Clients",
  projects: "Projects",
  team: "Team",
};

export function DashboardHeader() {
  const pathname = usePathname();
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
    </header>
  );
}
