"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ProjectBreadcrumbData = {
  clientId: string;
  clientName: string;
  propertyAddress: string;
} | null;

type Ctx = {
  projectBreadcrumb: ProjectBreadcrumbData;
  setProjectBreadcrumb: (value: ProjectBreadcrumbData) => void;
};

const ProjectBreadcrumbContext = createContext<Ctx | null>(null);

export function ProjectBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [projectBreadcrumb, setProjectBreadcrumbState] = useState<ProjectBreadcrumbData>(null);
  const setProjectBreadcrumb = useCallback((value: ProjectBreadcrumbData) => {
    setProjectBreadcrumbState(value);
  }, []);
  const value = useMemo(
    () => ({ projectBreadcrumb, setProjectBreadcrumb }),
    [projectBreadcrumb, setProjectBreadcrumb]
  );
  return (
    <ProjectBreadcrumbContext.Provider value={value}>{children}</ProjectBreadcrumbContext.Provider>
  );
}

export function useProjectBreadcrumb() {
  const ctx = useContext(ProjectBreadcrumbContext);
  if (!ctx) {
    throw new Error("useProjectBreadcrumb must be used within ProjectBreadcrumbProvider");
  }
  return ctx;
}
