"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Users, ListChecks, History } from "lucide-react";

type Project = {
  id: string;
  client_id: string;
  client_name: string | null;
  service_type: string;
  property_size: string | null;
  property_address: string;
  neighbourhood: string | null;
  stage: string;
  walkthrough_date: string | null;
  walkthrough_method: string | null;
  job_date: string | null;
  start_time: string | null;
  quote_amount: number | null;
  deposit_received: boolean;
  deposit_amount: number | null;
  invoice_amount: number | null;
  payment_received: boolean;
  notes: string | null;
  created_at: string;
};

const STAGES = [
  "inquiry", "walkthrough_booked", "quoted", "deposit_received",
  "scheduled", "in_progress", "cleared", "report_sent", "review_requested", "closed",
];
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s, s.replace(/_/g, " ")]));

const ACCESS_TYPES = [
  { value: "key", label: "Key" },
  { value: "lockbox", label: "Lockbox" },
  { value: "owner_present", label: "Owner present" },
  { value: "realtor_lockbox", label: "Realtor lockbox" },
  { value: "building_fob", label: "Building fob" },
];

type TimelineEvent = {
  id: string;
  event_type: string;
  event_description: string;
  event_category: string;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  details: Record<string, unknown> | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  contact: "border-l-neutral-500 bg-neutral-50 dark:bg-neutral-900/50",
  client: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
  project: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
  crew: "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30",
  communication: "border-l-green-500 bg-green-50/50 dark:bg-green-950/30",
  document: "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
  finance: "border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/30",
  review: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30",
  system: "border-l-gray-400 bg-gray-50 dark:bg-gray-900/50",
};

const CATEGORY_LABEL: Record<string, string> = {
  contact: "Contact",
  client: "Client",
  project: "Project",
  crew: "Crew",
  communication: "Communication",
  document: "Document",
  finance: "Finance",
  review: "Review",
  system: "System",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [access, setAccess] = useState<Record<string, unknown>>({});
  const [crewData, setCrewData] = useState<{
    crew: { id: string; name: string; email: string }[];
    available: { id: string; name: string; email: string; unavailableReason?: string }[];
    unavailable: { id: string; name: string; email: string; unavailableReason?: string }[];
    all: { id: string; name: string; email: string; assigned: boolean; available?: boolean; unavailableReason?: string }[];
    job_date: string | null;
  } | null>(null);
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());
  const [crewSaving, setCrewSaving] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{ id: string; item_text: string; completed: boolean; completed_by: string | null; completed_at: string | null; sort_order: number }[]>([]);
  const [checklistToggling, setChecklistToggling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stageChanging, setStageChanging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/access`).then((r) => r.json()).catch(() => ({ access: null })),
      fetch(`/api/projects/${id}/crew`).then((r) => r.json()).catch(() => ({ crew: [], available: [], unavailable: [], all: [], job_date: null })),
      fetch(`/api/projects/${id}/checklist`).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(`/api/projects/${id}/timeline`).then((r) => r.json()).catch(() => ({ events: [] })),
    ])
      .then(([projData, accessData, crewResp, checklistResp, timelineResp]) => {
        if (projData.error) throw new Error(projData.error);
        setProject(projData);
        setAccess(accessData.access ?? {});
        if (crewResp.crew !== undefined) {
          setCrewData({
            crew: crewResp.crew ?? [],
            available: crewResp.available ?? [],
            unavailable: crewResp.unavailable ?? [],
            all: crewResp.all ?? [],
            job_date: crewResp.job_date ?? null,
          });
          setSelectedCrewIds(new Set((crewResp.crew ?? []).map((c: { id: string }) => c.id)));
        }
        setChecklistItems((checklistResp?.items ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order));
        setTimelineEvents(timelineResp?.events ?? []);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const handleChecklistToggle = (itemId: string, completed: boolean) => {
    setChecklistToggling(itemId);
    fetch(`/api/projects/${id}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, completed }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setChecklistItems((prev) =>
          prev.map((it) => (it.id === data.id ? { ...it, completed: data.completed, completed_by: data.completed_by, completed_at: data.completed_at } : it))
        );
      })
      .catch(console.error)
      .finally(() => setChecklistToggling(null));
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : res.statusText || "Delete failed");
      }
      setDeleteDialogOpen(false);
      router.push("/projects");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const handleStageChange = (newStage: string) => {
    setStageChanging(true);
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data);
        load();
      })
      .catch(console.error)
      .finally(() => setStageChanging(false));
  };

  const handleSaveDetails = () => {
    if (!project) return;
    setSaving(true);
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data);
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  const handleCrewToggle = (userId: string, assigned: boolean) => {
    setSelectedCrewIds((prev) => {
      const next = new Set(prev);
      if (assigned) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSaveCrew = () => {
    setCrewSaving(true);
    fetch(`/api/projects/${id}/crew`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: Array.from(selectedCrewIds) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        load();
      })
      .catch(console.error)
      .finally(() => setCrewSaving(false));
  };

  const handleSaveAccess = () => {
    setSaving(true);
    fetch(`/api/projects/${id}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(access),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        load();
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }
  if (!project) return <div className="p-6">Project not found.</div>;

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "");
  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "");
  const formatCurrency = (n: number | null) => (n != null ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) : "-");
  const serviceLabel = (s: string | null) => (s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-");
  const UNKNOWN_DATE_KEY = "__unknown__";
  const safeDate = (d: string | null | undefined): Date | null => {
    if (d == null || String(d).trim() === "") return null;
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  /** Stable ISO date key (YYYY-MM-DD) for grouping; avoids locale re-parse issues. */
  const formatDateOnly = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    if (!parsed) return UNKNOWN_DATE_KEY;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const formatTimeOnly = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    return parsed ? parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
  };
  const formatDateTime = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    return parsed ? parsed.toLocaleString() : "—";
  };
  const formatDateLabel = (dateKey: string): string => {
    if (dateKey === UNKNOWN_DATE_KEY) return "Unknown date";
    const d = new Date(dateKey + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "Unknown date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "Today";
    if (d.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  };
  const timelineByDate = timelineEvents.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
    const date = formatDateOnly(e.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold truncate">{project.property_address}</h1>
        <Button
          type="button"
          variant="outline"
          className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive shrink-0"
          onClick={() => {
            setDeleteError(null);
            setDeleteDialogOpen(true);
          }}
        >
          Delete project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</p>
              <p className="font-medium">
                <Link href={`/clients/${project.client_id}`} className="text-primary hover:underline">
                  {project.client_name ?? "-"}
                </Link>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service</p>
              <p className="font-medium">{serviceLabel(project.service_type)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Neighbourhood</p>
              <p className="font-medium">{project.neighbourhood ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stage</p>
              <Select
                value={project.stage}
                onValueChange={handleStageChange}
                disabled={stageChanging}
              >
                <SelectTrigger id="stage" className="h-10 w-full max-w-[12rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job date</p>
              <p className="font-medium">{formatDate(project.job_date) || "-"}{project.start_time ? ` at ${project.start_time.slice(0, 5)}` : ""}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Property size</p>
              <p className="font-medium">{project.property_size ? project.property_size.replace(/_/g, " ") : "-"}</p>
            </div>
          </div>
          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quote</p>
              <p className="font-medium tabular-nums">{formatCurrency(project.quote_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="font-medium tabular-nums">{formatCurrency(project.invoice_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deposit</p>
              <p className="font-medium">{project.deposit_received ? (project.deposit_amount != null ? formatCurrency(project.deposit_amount) : "Received") : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</p>
              <p className="font-medium">{project.payment_received ? "Received" : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project fields</CardTitle>
              <CardDescription>Address, dates, amounts, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_address">Property address</Label>
                  <Input
                    id="property_address"
                    className="h-10"
                    value={project.property_address}
                    onChange={(e) => setProject((p) => (p ? { ...p, property_address: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighbourhood">Neighbourhood</Label>
                  <Input
                    id="neighbourhood"
                    className="h-10"
                    value={project.neighbourhood ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, neighbourhood: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_size">Property size</Label>
                  <Select
                    value={project.property_size ?? "__empty__"}
                    onValueChange={(v) => setProject((p) => (p ? { ...p, property_size: v === "__empty__" ? null : v } : p))}
                  >
                    <SelectTrigger id="property_size" className="h-10">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-</SelectItem>
                      <SelectItem value="basement">Basement</SelectItem>
                      <SelectItem value="half_house">Half house</SelectItem>
                      <SelectItem value="full_house">Full house</SelectItem>
                      <SelectItem value="full_estate">Full estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_date">Job date</Label>
                  <Input
                    type="date"
                    id="job_date"
                    className="h-10"
                    value={project.job_date ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, job_date: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start time</Label>
                  <Input
                    type="time"
                    id="start_time"
                    className="h-10"
                    value={formatTime(project.start_time)}
                    onChange={(e) => setProject((p) => (p ? { ...p, start_time: e.target.value || null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote_amount">Quote amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="quote_amount"
                    className="h-10"
                    value={project.quote_amount ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, quote_amount: e.target.value ? parseFloat(e.target.value) : null } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_amount">Invoice amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    id="invoice_amount"
                    className="h-10"
                    value={project.invoice_amount ?? ""}
                    onChange={(e) => setProject((p) => (p ? { ...p, invoice_amount: e.target.value ? parseFloat(e.target.value) : null } : p))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  className="min-h-24"
                  value={project.notes ?? ""}
                  onChange={(e) => setProject((p) => (p ? { ...p, notes: e.target.value || null } : p))}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveDetails} loading={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key and access</CardTitle>
              <CardDescription>Access type, lockbox, instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="access_type">Access type</Label>
                  <Select
                    value={(access.access_type as string) ?? "__empty__"}
                    onValueChange={(v) => setAccess((a) => ({ ...a, access_type: v === "__empty__" ? null : v }))}
                  >
                    <SelectTrigger id="access_type" className="h-10">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-</SelectItem>
                      {ACCESS_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_from">Received from</Label>
                  <Input
                    id="received_from"
                    className="h-10"
                    value={(access.received_from as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, received_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_date">Received date</Label>
                  <Input
                    type="datetime-local"
                    id="received_date"
                    className="h-10"
                    value={((access.received_date as string) ?? "").replace(" ", "T").slice(0, 16)}
                    onChange={(e) => setAccess((a) => ({ ...a, received_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="lockbox_code">Lockbox code</Label>
                  <Input
                    type="password"
                    id="lockbox_code"
                    className="h-10"
                    value={(access.lockbox_code as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, lockbox_code: e.target.value }))}
                    placeholder="Masked"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="building_instructions">Building instructions</Label>
                  <Textarea
                    id="building_instructions"
                    className="min-h-24"
                    value={(access.building_instructions as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, building_instructions: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parking_instructions">Parking instructions</Label>
                  <Input
                    id="parking_instructions"
                    className="h-10"
                    value={(access.parking_instructions as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, parking_instructions: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_returned_to">Key returned to</Label>
                  <Input
                    id="key_returned_to"
                    className="h-10"
                    value={(access.key_returned_to as string) ?? ""}
                    onChange={(e) => setAccess((a) => ({ ...a, key_returned_to: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_returned_date">Key returned date</Label>
                  <Input
                    type="datetime-local"
                    id="key_returned_date"
                    className="h-10"
                    value={((access.key_returned_date as string) ?? "").replace(" ", "T").slice(0, 16)}
                    onChange={(e) => setAccess((a) => ({ ...a, key_returned_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveAccess} loading={saving}>
                {saving ? "Saving…" : "Save access"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crew assignment</CardTitle>
              <CardDescription>
                {crewData?.job_date
                  ? `Job date: ${new Date(crewData.job_date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}. Set job date in Details to see availability.`
                  : "Assign crew. Set a job date in Details to see who is available."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {crewData ? (
                <>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Assigned ({selectedCrewIds.size})</p>
                      {crewData.crew.length === 0 && crewData.all.length > 0 && (
                        <Empty className="border-0 py-6">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Users className="size-5" />
                            </EmptyMedia>
                            <EmptyTitle className="text-base">No one assigned yet</EmptyTitle>
                            <EmptyDescription>Add from Available below.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}
                      {crewData.all.length === 0 && (
                        <Empty className="border-0 py-6">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Users className="size-5" />
                            </EmptyMedia>
                            <EmptyTitle className="text-base">No crew members yet</EmptyTitle>
                            <EmptyDescription>Invite crew from Team.</EmptyDescription>
                          </EmptyHeader>
                          <EmptyContent>
                            <Link href="/team">
                              <Button variant="outline" size="sm">Go to Team</Button>
                            </Link>
                          </EmptyContent>
                        </Empty>
                      )}
                      {crewData.all
                        .filter((m) => selectedCrewIds.has(m.id))
                        .map((member) => (
                          <li
                            key={member.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm list-none"
                          >
                            <span className="font-medium">{member.name}</span>
                            <span className="text-muted-foreground truncate ml-2">{member.email}</span>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="shrink-0 ml-2"
                              onClick={() => handleCrewToggle(member.id, true)}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                    </div>
                    {crewData.available.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Available ({crewData.available.length})</p>
                        <ul className="space-y-1.5">
                          {crewData.available.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between rounded-md border border-green-200 dark:border-green-900/50 px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{member.name}</span>
                              <span className="text-muted-foreground truncate ml-2">{member.email}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0 ml-2"
                                onClick={() => handleCrewToggle(member.id, false)}
                              >
                                Add
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {crewData.unavailable.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Unavailable ({crewData.unavailable.length})</p>
                        <ul className="space-y-1.5">
                          {crewData.unavailable.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between rounded-md border border-amber-200 dark:border-amber-900/50 px-3 py-2 text-sm"
                            >
                              <div className="min-w-0">
                                <span className="font-medium">{member.name}</span>
                                <span className="text-muted-foreground truncate ml-2">{member.email}</span>
                                {member.unavailableReason && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{member.unavailableReason}</p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 ml-2 opacity-70"
                                onClick={() => handleCrewToggle(member.id, false)}
                                title="Add anyway"
                              >
                                Add
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSaveCrew} loading={crewSaving} disabled={crewSaving || crewData.all.length === 0}>
                    {crewSaving ? "Saving…" : "Save crew"}
                  </Button>
                </>
              ) : (
                <LoadingSpinner message="Loading crew…" size="sm" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist</CardTitle>
              <CardDescription>
                {checklistItems.length > 0
                  ? `${checklistItems.filter((i) => i.completed).length} of ${checklistItems.length} complete`
                  : "Service-specific checklist. Items are created when the project is created."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklistItems.length === 0 ? (
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ListChecks className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">No checklist items</EmptyTitle>
                    <EmptyDescription>Items are created when the project is created with a service type.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="space-y-1.5">
                  {checklistItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border p-3 text-sm"
                    >
                      <Checkbox
                        id={`check-${item.id}`}
                        checked={item.completed}
                        disabled={checklistToggling === item.id}
                        onCheckedChange={(checked) => handleChecklistToggle(item.id, checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor={`check-${item.id}`} className="flex-1 cursor-pointer">
                        <span className={item.completed ? "text-muted-foreground line-through" : ""}>{item.item_text}</span>
                        {item.completed_at && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(item.completed_at).toLocaleString()}
                          </span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Project notes are in the Details tab.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>

        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job timeline</CardTitle>
              <CardDescription>Activity for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(timelineByDate).length === 0 ? (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">No events yet</EmptyTitle>
                    <EmptyDescription>Stage changes and activity will appear here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                  {Object.entries(timelineByDate)
                    .sort(([a], [b]) => (b > a ? 1 : -1))
                    .map(([date, dayEvents]) => (
                      <div key={date} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-card/95 backdrop-blur py-1 z-[1]">
                          {formatDateLabel(date)}
                        </p>
                        <ul className="space-y-2">
                          {dayEvents.map((e) => (
                            <li
                              key={e.id}
                              className={`rounded-r-md border-l-4 pl-3 pr-3 py-2.5 text-sm ${CATEGORY_COLORS[e.event_category] ?? CATEGORY_COLORS.system}`}
                              title={formatDateTime(e.created_at)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium leading-snug break-words">{e.event_description}</span>
                                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground" title={e.event_category}>
                                  {CATEGORY_LABEL[e.event_category] ?? e.event_category}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                                {e.created_by_name} · {e.created_by_role} · {formatTimeOnly(e.created_at)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently remove this project and its checklist, crew assignments, and access details. The client timeline will show that the project was deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProject} loading={deleting} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
