"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectBreadcrumb } from "@/components/project-breadcrumb-context";
import { cn } from "@/lib/utils";
import { Building2, FileUp, FolderKanban, Plus, UserPlus, Users } from "lucide-react";

const SEGMENTS: Record<string, string> = {
  "": "Home",
  contacts: "Contacts",
  clients: "Clients",
  projects: "Projects",
  team: "Team",
};

const ADD_ACTIONS = [
  {
    label: "Contact",
    description: "Add a new contact",
    href: "/contacts?add=1",
    icon: UserPlus,
  },
  {
    label: "Import contacts",
    description: "Upload a CSV",
    href: "/contacts/import",
    icon: FileUp,
  },
  {
    label: "Client",
    description: "Add a client profile",
    href: "/clients?add=1",
    icon: Building2,
  },
  {
    label: "Project",
    description: "Start a new project",
    href: "/projects/new",
    icon: FolderKanban,
  },
  {
    label: "Team member",
    description: "Send a crew invite",
    href: "/team?invite=1",
    icon: Users,
  },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const { projectBreadcrumb } = useProjectBreadcrumb();

  function navigateTo(href: string) {
    setAddOpen(false);
    router.push(href);
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  const second = segments[1];
  const label = SEGMENTS[first] ?? (first ? first.charAt(0).toUpperCase() + first.slice(1) : "Home");
  const isProjectDetail =
    first === "projects" && second !== undefined && second !== "new";

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
          {first && second && isProjectDetail && projectBreadcrumb && (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/projects">{SEGMENTS.projects}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block max-w-[140px] sm:max-w-[200px]">
                <BreadcrumbLink asChild>
                  <Link href={`/clients/${projectBreadcrumb.clientId}`} className="truncate">
                    {projectBreadcrumb.clientName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="min-w-0 max-w-[min(100%,28rem)]">
                <BreadcrumbPage className="truncate">{projectBreadcrumb.propertyAddress}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {first && second && isProjectDetail && !projectBreadcrumb && (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/projects">{SEGMENTS.projects}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">Project</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {first && second && !isProjectDetail && (
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 touch-manipulation"
          aria-label="Add"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add</DialogTitle>
              <DialogDescription>Choose what you want to create. You&apos;ll go to the right screen with the form ready.</DialogDescription>
            </DialogHeader>
            <ul className="grid gap-1 pt-2">
              {ADD_ACTIONS.map(({ label, description, href, icon: Icon }) => (
                <li key={href}>
                  <button
                    type="button"
                    onClick={() => navigateTo(href)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
