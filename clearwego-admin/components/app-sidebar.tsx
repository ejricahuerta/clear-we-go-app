"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  HomeIcon,
  UsersIcon,
  Building2Icon,
  FolderKanbanIcon,
  UserPlusIcon,
  LogOutIcon,
  MapPinIcon,
} from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/contacts", label: "Contacts", icon: UsersIcon },
  { href: "/clients", label: "Clients", icon: Building2Icon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/team", label: "Team", icon: UserPlusIcon },
];

type SidebarProject = {
  id: string;
  property_address: string;
  client_name: string | null;
  stage: string;
  job_date: string | null;
};

function projectTooltip(p: SidebarProject) {
  const bits = [p.property_address, p.client_name].filter(Boolean);
  return bits.join(" · ");
}

function SidebarProjectLinks({
  projects,
  pathname,
}: {
  projects: SidebarProject[];
  pathname: string;
}) {
  return (
    <>
      {projects.map((p) => {
        const href = `/projects/${p.id}`;
        const label = p.property_address?.trim() || "Project";
        return (
          <SidebarMenuItem key={p.id}>
            <SidebarMenuButton
              asChild
              isActive={pathname === href || pathname.startsWith(`${href}/`)}
              tooltip={projectTooltip(p)}
            >
              <Link href={href}>
                <MapPinIcon />
                <span className="truncate">{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [important, setImportant] = useState<SidebarProject[]>([]);
  const [active, setActive] = useState<SidebarProject[]>([]);
  const [sidebarLoadError, setSidebarLoadError] = useState(false);

  const loadSidebarProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/sidebar");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setSidebarLoadError(true);
        return;
      }
      setSidebarLoadError(false);
      setImportant(Array.isArray(data.important) ? data.important : []);
      setActive(Array.isArray(data.active) ? data.active : []);
    } catch {
      setSidebarLoadError(true);
    }
  }, []);

  // Close mobile sheet when navigating so the drawer doesn't stay open
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  useEffect(() => {
    void loadSidebarProjects();
  }, [pathname, loadSidebarProjects]);

  useEffect(() => {
    function onRefresh() {
      void loadSidebarProjects();
    }
    window.addEventListener("clearwego-sidebar-projects", onRefresh);
    return () => window.removeEventListener("clearwego-sidebar-projects", onRefresh);
  }, [loadSidebarProjects]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const hasAnyOpen = important.length > 0 || active.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0 bg-transparent">
                  <Image src="/icons/logo.png" alt="Clear We Go" width={32} height={32} className="object-contain size-full bg-transparent" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Clear We Go</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === href || (href !== "/" && pathname.startsWith(href))}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {important.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Important</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarProjectLinks projects={important} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {active.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Active projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarProjectLinks projects={active} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {!hasAnyOpen ? (
          <SidebarGroup>
            <SidebarGroupLabel>Open jobs</SidebarGroupLabel>
            <SidebarGroupContent>
              <p className="px-2 pb-1 text-xs leading-relaxed text-sidebar-foreground/60">
                {sidebarLoadError
                  ? "Could not load projects. If you just added sidebar pins, run the latest database migration and refresh."
                  : "No active projects right now. Open jobs (not closed) appear here; In progress is always under Important, or pin other jobs from project details."}
              </p>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOutIcon />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
