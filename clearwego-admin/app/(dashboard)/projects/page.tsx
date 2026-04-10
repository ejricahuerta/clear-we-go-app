"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ChevronsRightLeft, ChevronRight, FolderKanban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROJECT_STAGE_LABELS, PROJECT_STAGES } from "@/lib/projects/stages";

type Project = {
  id: string;
  client_id: string;
  client_name: string | null;
  service_type: string;
  property_address: string;
  neighbourhood: string | null;
  stage: string;
  job_date: string | null;
  start_time: string | null;
  quote_amount: number | null;
  invoice_amount: number | null;
  payment_received: boolean;
  created_at: string;
  pinned?: boolean;
};

const STAGES_ORDER = [...PROJECT_STAGES] as string[];

const STAGE_LABELS: Record<string, string> = { ...PROJECT_STAGE_LABELS };

/** Service-type accent; uses theme chart hues (forest / warm) instead of default palette */
const SERVICE_COLORS: Record<string, string> = {
  estate_cleanout: "border-l-chart-2",
  presale_clearout: "border-l-chart-1",
  tenant_moveout: "border-l-chart-3",
  downsizing: "border-l-chart-4",
};
const SERVICE_ACCENT_FALLBACK = "border-l-primary/45";

const stageDroppableId = (stage: string) => `stage:${stage}` as const;

function KanbanDraggableProjectCard({
  project,
  formatDate,
}: {
  project: Project;
  formatDate: (d: string | null) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { type: "project", project },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <Link href={`/projects/${project.id}`} className="block outline-none">
        <div
          className={`cursor-grab rounded-md border border-border/80 bg-background p-3 text-sm shadow-sm transition-colors hover:border-border hover:bg-accent/25 active:cursor-grabbing border-l-[3px] ${SERVICE_COLORS[project.service_type] ?? SERVICE_ACCENT_FALLBACK}`}
        >
          <p className="font-medium truncate">{project.client_name ?? "—"}</p>
          <p className="text-muted-foreground text-xs truncate">
            {project.service_type?.replace(/_/g, " ")}
          </p>
          <p className="text-muted-foreground text-xs truncate">{project.property_address}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(project.job_date)}</p>
        </div>
      </Link>
    </div>
  );
}

function KanbanStageColumn({
  stage,
  stageLabel,
  items,
  isCollapsed,
  onToggleCollapse,
  formatDate,
}: {
  stage: string;
  stageLabel: string;
  items: Project[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  formatDate: (d: string | null) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageDroppableId(stage),
  });

  return (
    <div
      className={`flex h-full min-h-0 shrink-0 flex-col rounded-lg border border-border/70 bg-card shadow-[var(--shadow-xs)] transition-[width] duration-300 ease-in-out dark:bg-muted ${isCollapsed ? "w-12" : "w-72"}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border/50 bg-muted/25 px-2 py-2 dark:bg-background/35">
        {isCollapsed ? (
          <div className="flex flex-1 flex-col items-center gap-0.5">
            <p className="text-[10px] font-semibold uppercase leading-tight text-muted-foreground [writing-mode:vertical-rl] [text-orientation:mixed]">
              {stageLabel}
            </p>
            <p className="text-xs font-medium">{items.length}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onToggleCollapse}
                  aria-label={`Expand ${stageLabel} column`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand column</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
                {stageLabel}
              </p>
              <p className="text-sm font-medium">{items.length}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={onToggleCollapse}
                  aria-label={`Collapse ${stageLabel} column`}
                >
                  <ChevronsRightLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse column</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-0 flex-1 bg-muted/20 transition-colors ${isCollapsed ? "min-h-[4rem]" : "space-y-2 overflow-y-auto p-2"} ${isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/25" : ""}`}
      >
        {!isCollapsed &&
          items.map((p) => (
            <KanbanDraggableProjectCard key={p.id} project={p} formatDate={formatDate} />
          ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const [activeDragProject, setActiveDragProject] = useState<Project | null>(null);
  const hasAutoCollapsed = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const toggleCol = (stage: string) => {
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const allCollapsed = collapsedCols.size === STAGES_ORDER.length;
  const collapseOrExpandAll = () => {
    setCollapsedCols(allCollapsed ? new Set() : new Set(STAGES_ORDER));
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (stageFilter) params.set("stage", stageFilter);
    if (serviceFilter) params.set("service_type", serviceFilter);
    if (search) params.set("search", search);
    params.set("pageSize", "200");

    fetch(`/api/projects?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProjects(data.projects ?? []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [stageFilter, serviceFilter, search]);

  useEffect(() => {
    if (loading || hasAutoCollapsed.current) return;
    hasAutoCollapsed.current = true;
    const empty = new Set(
      STAGES_ORDER.filter((stage) => !projects.some((p) => p.stage === stage))
    );
    if (empty.size > 0) setCollapsedCols(empty);
  }, [loading, projects]);

  const byStage = STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = projects.filter((p) => p.stage === stage);
    return acc;
  }, {} as Record<string, Project[]>);

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "-");

  /** Date-only `job_date` strings avoid UTC shift. */
  const formatListJobDate = (d: string | null) => {
    if (!d) return "—";
    const parsed = new Date(d.length <= 10 ? `${d}T12:00:00` : d);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const formatListJobTime = (t: string | null) => {
    if (!t) return "—";
    const s = String(t).trim();
    return /^\d{1,2}:\d{2}/.test(s) ? s.slice(0, 5) : "—";
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const p = projects.find((x) => x.id === id);
    setActiveDragProject(p ?? null);
  };

  const expandCollapsedNeighborsOfStage = (centerStage: string) => {
    const idx = STAGES_ORDER.indexOf(centerStage);
    if (idx === -1) return;
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      let changed = false;
      if (idx > 0) {
        const left = STAGES_ORDER[idx - 1];
        if (next.has(left)) {
          next.delete(left);
          changed = true;
        }
      }
      if (idx < STAGES_ORDER.length - 1) {
        const right = STAGES_ORDER[idx + 1];
        if (next.has(right)) {
          next.delete(right);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
    const overId = String(over.id);
    let stage: string | null = null;
    if (overId.startsWith("stage:")) {
      stage = overId.slice("stage:".length);
    } else {
      const hit = projects.find((p) => p.id === overId);
      if (hit) stage = hit.stage;
    }
    if (stage && STAGES_ORDER.includes(stage)) {
      expandCollapsedNeighborsOfStage(stage);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragProject(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    let newStage: string | null = null;
    if (overId.startsWith("stage:")) {
      newStage = overId.slice("stage:".length);
    } else {
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) newStage = overProject.stage;
    }
    if (!newStage || !STAGES_ORDER.includes(newStage)) return;
    const projectId = String(active.id);
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.stage === newStage) return;

    const prevStage = project.stage;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, stage: newStage } : p))
    );

    fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) throw new Error(data.error);
      })
      .catch(() => {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, stage: prevStage } : p))
        );
      });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Same header pattern as Contacts / Clients: title, subtitle, primary action */}
      <div className="shrink-0 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Jobs, stages, and key/access</p>
          </div>
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        </div>

        {/* Tabs and filters: full-width stack on small screens */}
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")} className="w-full sm:w-auto">
            <TabsList className="flex h-9 w-full gap-1 sm:w-auto">
              <TabsTrigger value="kanban" className="flex-1 sm:flex-none">
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1 sm:flex-none">
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            type="search"
            placeholder="Search address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 min-w-0 w-full sm:w-48"
          />
          <Select value={stageFilter || "__all__"} onValueChange={(v) => setStageFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-full sm:w-[10rem]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All stages</SelectItem>
              {STAGES_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={serviceFilter || "__all__"} onValueChange={(v) => setServiceFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-full sm:w-[10rem]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              <SelectItem value="estate_cleanout">Estate cleanout</SelectItem>
              <SelectItem value="presale_clearout">Pre-sale clearout</SelectItem>
              <SelectItem value="tenant_moveout">Tenant move-out</SelectItem>
              <SelectItem value="downsizing">Downsizing</SelectItem>
            </SelectContent>
          </Select>
          {view === "kanban" && (
            <Button
              variant="outline"
              size="sm"
              onClick={collapseOrExpandAll}
              className="h-9 w-full justify-center sm:ml-auto sm:w-auto"
            >
              {allCollapsed ? (
                <>
                  <ChevronRight className="h-4 w-4 mr-1.5" />
                  Expand all
                </>
              ) : (
                <>
                  <ChevronsRightLeft className="h-4 w-4 mr-1.5" />
                  Collapse all
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content: Card+table for list, full-bleed board for Kanban */}
      <div
        className={
          view === "kanban"
            ? "-mx-4 flex min-h-0 flex-1 flex-col overflow-hidden"
            : "min-h-0 flex-1 overflow-auto px-6 pb-6"
        }
      >
        {loading ? (
          <Card>
            <CardContent className="min-h-[200px] p-0">
              <LoadingSpinner className="min-h-[200px]" />
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderKanban className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No projects yet</EmptyTitle>
                  <EmptyDescription>Create your first project to get started.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link href="/projects/new">
                    <Button>New project</Button>
                  </Link>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : view === "list" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="whitespace-nowrap">Job date</TableHead>
                    <TableHead className="whitespace-nowrap">Start time</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="secondary">{STAGE_LABELS[p.stage] ?? p.stage}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/clients/${p.client_id}`} className="font-medium text-primary hover:underline">
                            {p.client_name ?? "-"}
                          </Link>
                          {p.service_type ? (
                            <span className="text-xs capitalize text-muted-foreground">
                              {p.service_type.replace(/_/g, " ")}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] min-w-0">
                        <span className="line-clamp-2 text-sm" title={p.property_address}>
                          {p.property_address || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatListJobDate(p.job_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatListJobTime(p.start_time)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Kanban: full-page board, edge-to-edge, fills all space below header */
          <TooltipProvider>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDragProject(null)}
            >
              <div className="flex h-full min-h-0 flex-1 gap-0 overflow-hidden">
                <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-2">
                  {STAGES_ORDER.map((stage) => (
                    <KanbanStageColumn
                      key={stage}
                      stage={stage}
                      stageLabel={STAGE_LABELS[stage] ?? stage}
                      items={byStage[stage] ?? []}
                      isCollapsed={collapsedCols.has(stage)}
                      onToggleCollapse={() => toggleCol(stage)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeDragProject ? (
                  <div
                    className={`pointer-events-none w-72 cursor-grabbing rounded-md border border-border/80 bg-background p-3 text-sm shadow-lg border-l-[3px] ${SERVICE_COLORS[activeDragProject.service_type] ?? SERVICE_ACCENT_FALLBACK}`}
                  >
                    <p className="font-medium truncate">{activeDragProject.client_name ?? "—"}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {activeDragProject.service_type?.replace(/_/g, " ")}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">
                      {activeDragProject.property_address}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(activeDragProject.job_date)}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
