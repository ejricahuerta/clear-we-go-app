"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

  const byStage = STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = projects.filter((p) => p.stage === stage);
    return acc;
  }, {} as Record<string, Project[]>);

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "-");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Same header pattern as Contacts / Clients: title, subtitle, primary action */}
      <div className="space-y-4 p-6">
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
            <CardContent className="p-0">
              <div className="space-y-3 p-6">
                <div className="flex gap-4 border-b pb-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-14 ml-auto" />
                </div>
                {[1, 2, 3, 4, 5, 6, 8].map((i) => (
                  <div key={i} className="flex gap-4 py-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-14 ml-auto rounded-md" />
                  </div>
                ))}
              </div>
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
          <div className="flex h-full min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-2">
              {STAGES_ORDER.map((stage) => (
                <div
                  key={stage}
                  className="flex h-full min-h-0 w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
                >
                  <div className="shrink-0 border-b bg-muted/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {STAGE_LABELS[stage]}
                    </p>
                    <p className="text-sm font-medium">{(byStage[stage] ?? []).length}</p>
                  </div>
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
