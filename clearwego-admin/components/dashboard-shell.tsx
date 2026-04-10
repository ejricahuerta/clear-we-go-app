"use client";

import type { ReactNode } from "react";
import { ProjectBreadcrumbProvider } from "@/components/project-breadcrumb-context";

export function DashboardShell({ children }: { children: ReactNode }) {
  return <ProjectBreadcrumbProvider>{children}</ProjectBreadcrumbProvider>;
}
