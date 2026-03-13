"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronsRightLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
};

const STAGES_ORDER = [
  "inquiry", "walkthrough_booked", "quoted", "deposit_received",
  "scheduled", "in_progress", "cleared", "report_sent", "review_requested", "closed",
];

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  STAGES_ORDER.map((s) => [s, s.replace(/_/g, " ")])
);

const SERVICE_COLORS: Record<string, string> = {
  estate_cleanout: "border-l-amber-500",
  presale_clearout: "border-l-blue-500",
  tenant_moveout: "border-l-green-500",
  downsizing: "border-l-purple-500",
};

export default function ProjectsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const hasAutoCollapsed = useRef(false);

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

        {/* Tabs and filters: same row as on other list pages */}
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            type="search"
            placeholder="Search address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Select value={stageFilter || "__all__"} onValueChange={(v) => setStageFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[10rem]">
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
            <SelectTrigger className="w-[10rem]">
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
            <Button variant="outline" size="sm" onClick={collapseOrExpandAll} className="ml-auto sm:ml-auto">
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
            <CardContent className="flex min-h-[200px] items-center justify-center p-6">
              <p className="text-muted-foreground">Loading…</p>
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
                    <TableHead>Job date</TableHead>
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
                          {(p.service_type || p.property_address) ? (
                            <span className="text-xs text-muted-foreground">
                              {[p.service_type?.replace(/_/g, " "), p.property_address].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.job_date)}</TableCell>
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
            <div className="flex h-full min-h-0 flex-1 gap-0 overflow-hidden">
              <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-2">
                {STAGES_ORDER.map((stage) => {
                  const isCollapsed = collapsedCols.has(stage);
                  return (
                    <div
                      key={stage}
                      className={`flex h-full min-h-0 shrink-0 flex-col rounded-lg border bg-muted transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-12" : "w-72"}`}
                    >
                      <div className="flex shrink-0 items-center justify-between gap-1 border-b bg-muted px-2 py-2">
                        {isCollapsed ? (
                          <div className="flex flex-1 flex-col items-center gap-0.5">
                            <p className="text-[10px] font-semibold uppercase leading-tight text-muted-foreground [writing-mode:vertical-rl] [text-orientation:mixed]">
                              {STAGE_LABELS[stage]}
                            </p>
                            <p className="text-xs font-medium">{(byStage[stage] ?? []).length}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleCol(stage)}
                                  aria-label={`Expand ${STAGE_LABELS[stage]} column`}
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
                                {STAGE_LABELS[stage]}
                              </p>
                              <p className="text-sm font-medium">{(byStage[stage] ?? []).length}</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => toggleCol(stage)}
                                  aria-label={`Collapse ${STAGE_LABELS[stage]} column`}
                                >
                                  <ChevronsRightLeft className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Collapse column</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted p-2">
                          {(byStage[stage] ?? []).map((p) => (
                            <Link key={p.id} href={`/projects/${p.id}`}>
                              <div
                                className={`rounded-md border bg-background p-3 text-sm shadow-sm transition-colors hover:bg-muted/50 border-l-4 ${SERVICE_COLORS[p.service_type] ?? ""}`}
                              >
                                <p className="font-medium truncate">{p.client_name ?? "—"}</p>
                                <p className="text-muted-foreground text-xs truncate">{p.service_type?.replace(/_/g, " ")}</p>
                                <p className="text-muted-foreground text-xs truncate">{p.property_address}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatDate(p.job_date)}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
