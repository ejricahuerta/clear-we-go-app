"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TIMELINE_CATEGORY_LABEL_CLASS,
  TIMELINE_EVENT_ROW_CLASS,
  timelineDescriptionWithoutTrailingAttribution,
} from "@/lib/timeline-display";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, FolderOpen, History } from "lucide-react";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from "@/lib/clients/status";
import { PROJECT_SERVICE_TYPES } from "@/lib/projects/insert-with-checklist";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  neighbourhood: string | null;
  client_type: string | null;
  referral_source: string | null;
  sms_opted_out: boolean;
  google_review_received: boolean;
  notes: string | null;
  status: string;
  quote_amount: number | null;
  pending_property_address: string | null;
  pending_service_type: string | null;
  quo_contact_id: string | null;
  created_at: string;
  archived_at: string | null;
};

type Project = {
  id: string;
  service_type: string;
  property_address: string;
  neighbourhood: string | null;
  stage: string;
  quote_amount: number | null;
  invoice_amount: number | null;
  payment_received: boolean;
  job_date: string | null;
  created_at: string;
  archived_at: string | null;
};

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

/** Left accent on project rows; aligned with Projects kanban cards */
const PROJECT_SERVICE_ACCENTS: Record<string, string> = {
  estate_cleanout: "border-l-chart-2",
  presale_clearout: "border-l-chart-1",
  tenant_moveout: "border-l-chart-3",
  downsizing: "border-l-chart-4",
};

const formatProjectJobDate = (d: string | null) => {
  if (!d) return "Not scheduled";
  const parsed = new Date(d.length <= 10 ? `${d}T12:00:00` : d);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const CLIENT_TYPES = [
  { value: "executor", label: "Executor" },
  { value: "estate_lawyer", label: "Estate lawyer" },
  { value: "realtor", label: "Realtor" },
  { value: "property_manager", label: "Property manager" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [timelineFilter, setTimelineFilter] = useState("");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/clients/${id}/projects`).then((r) => r.json()),
      fetch(`/api/clients/${id}/timeline`).then((r) => r.json()),
    ])
      .then(([clientData, projectsData, timelineData]) => {
        if (clientData.error) throw new Error(clientData.error);
        setClient(clientData);
        setForm({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          neighbourhood: clientData.neighbourhood,
          client_type: clientData.client_type,
          referral_source: clientData.referral_source,
          sms_opted_out: clientData.sms_opted_out ?? false,
          google_review_received: clientData.google_review_received ?? false,
          notes: clientData.notes,
          status: clientData.status ?? "inquiry",
          quote_amount: clientData.quote_amount ?? null,
          pending_property_address: clientData.pending_property_address ?? null,
          pending_service_type: clientData.pending_service_type ?? null,
          quo_contact_id: clientData.quo_contact_id ?? null,
        });
        setProjects(projectsData.projects ?? []);
        setTotalRevenue(projectsData.totalRevenue ?? 0);
        setEvents(timelineData.events ?? []);
      })
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const handleSave = () => {
    setSaving(true);
    fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setClient(data);
        load();
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  const displayFullName = client ? `${client.first_name} ${client.last_name}`.trim() : "";
  const deleteNameMatches =
    deleteConfirmName.trim().toLowerCase() === displayFullName.toLowerCase();

  const handlePermanentDelete = () => {
    if (!deleteNameMatches) return;
    setDeleting(true);
    fetch(`/api/clients/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDeleteOpen(false);
        router.push("/clients");
      })
      .catch(console.error)
      .finally(() => setDeleting(false));
  };

  const handleAddNote = () => {
    const text = newNote.trim();
    if (!text) return;
    setAddingNote(true);
    fetch(`/api/clients/${id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "client_note_added",
        event_category: "client",
        event_description: `Note added: ${text.slice(0, 80)}${text.length > 80 ? "..." : ""}`,
        details: { note: text },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setNewNote("");
        setAddNoteOpen(false);
        load();
      })
      .catch(console.error)
      .finally(() => setAddingNote(false));
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }
  if (!client) return <div className="p-6">Client not found.</div>;

  const UNKNOWN_DATE_KEY = "__unknown__";
  const safeDate = (d: string | null | undefined): Date | null => {
    if (d == null || String(d).trim() === "") return null;
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const formatDate = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    return parsed ? parsed.toLocaleString() : "—";
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
  const formatTime = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    return parsed ? parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
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

  let filteredEvents = events;
  if (timelineFilter) filteredEvents = filteredEvents.filter((e) => e.event_category === timelineFilter);
  if (timelineSearch.trim()) {
    const q = timelineSearch.toLowerCase();
    filteredEvents = filteredEvents.filter(
      (e) => e.event_description.toLowerCase().includes(q) || JSON.stringify(e.details ?? {}).toLowerCase().includes(q)
    );
  }
  const eventsByDate = filteredEvents.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
    const date = formatDateOnly(e.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  const isArchived = client.archived_at != null;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {client.first_name} {client.last_name}
        </h1>
        {!isArchived ? (
          <div className="flex w-full shrink-0 flex-wrap gap-2 justify-start sm:w-auto sm:justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddNoteOpen(true)}>
              Add note
            </Button>
            <Button size="sm" asChild>
              <Link href={`/projects/new?clientId=${id}`}>New project</Link>
            </Button>
          </div>
        ) : null}
      </div>
      {isArchived ? (
        <div
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          This client is archived: they do not appear on the main client list. Projects and timeline below are unchanged.
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>Edit and save</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={form.first_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={form.last_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label>Client type</Label>
              <Select value={form.client_type ?? "__empty__"} onValueChange={(v) => setForm((f) => ({ ...f, client_type: v === "__empty__" ? null : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">-</SelectItem>
                  {CLIENT_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Address</Label>
              <Input value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label>Neighbourhood</Label>
              <Input value={form.neighbourhood ?? ""} onChange={(e) => setForm((f) => ({ ...f, neighbourhood: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <Label>Referral source</Label>
              <Input value={form.referral_source ?? ""} onChange={(e) => setForm((f) => ({ ...f, referral_source: e.target.value || null }))} />
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox id="sms_opted_out" checked={form.sms_opted_out ?? false} onCheckedChange={(checked) => setForm((f) => ({ ...f, sms_opted_out: !!checked }))} />
                <Label htmlFor="sms_opted_out" className="font-normal">SMS opted out</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="google_review_received" checked={form.google_review_received ?? false} onCheckedChange={(checked) => setForm((f) => ({ ...f, google_review_received: !!checked }))} />
                <Label htmlFor="google_review_received" className="font-normal">Google review received</Label>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} loading={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales funnel</CardTitle>
          <CardDescription>
            Pre-job stages live on the client. When status becomes <strong>Deposit received</strong>, a project is
            auto-created if pending service type and property address are set; otherwise the timeline reminds you to add
            them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Funnel status</Label>
              <Select
                value={form.status ?? "inquiry"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLIENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quote amount (pre-project)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="—"
                value={form.quote_amount != null ? String(form.quote_amount) : ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setForm((f) => ({
                    ...f,
                    quote_amount: raw === "" ? null : Number.isNaN(parseFloat(raw)) ? f.quote_amount : parseFloat(raw),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Pending service (for auto-project)</Label>
              <Select
                value={form.pending_service_type ?? "__empty__"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, pending_service_type: v === "__empty__" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">—</SelectItem>
                  {PROJECT_SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Pending property address</Label>
              <Input
                value={form.pending_property_address ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pending_property_address: e.target.value || null }))
                }
                placeholder="Used when creating a project from deposit"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Quo contact id (optional)</Label>
              <Input
                value={form.quo_contact_id ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, quo_contact_id: e.target.value.trim() || null }))}
                placeholder="OpenPhone / Quo contact id"
              />
            </div>
          </div>
          <Button onClick={handleSave} loading={saving} variant="secondary">
            {saving ? "Saving…" : "Save funnel"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects</CardTitle>
          <CardDescription>Total revenue (paid): ${totalRevenue.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen className="size-5" />
                </EmptyMedia>
                <EmptyTitle className="text-base">No projects yet</EmptyTitle>
                <EmptyDescription>Create a project from the Projects page.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href={`/projects/new?clientId=${id}`}>
                  <Button variant="outline" size="sm">New project</Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    aria-label={`Open project: ${p.service_type?.replace(/_/g, " ") ?? "project"}${p.property_address ? `, ${p.property_address}` : ""}`}
                    className={cn(
                      "group flex gap-3 rounded-lg border border-border/80 bg-card p-3 text-left shadow-sm transition-[border-color,box-shadow,background-color]",
                      "hover:border-border hover:bg-muted/30 hover:shadow-md",
                      "border-l-[3px]",
                      PROJECT_SERVICE_ACCENTS[p.service_type] ?? "border-l-muted-foreground/35"
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium capitalize leading-snug text-foreground">
                          {p.service_type?.replace(/_/g, " ") ?? "Project"}
                        </span>
                        <Badge variant="secondary" className="max-w-full shrink font-normal capitalize">
                          <span className="truncate">{p.stage.replace(/_/g, " ")}</span>
                        </Badge>
                        {p.archived_at != null ? (
                          <Badge variant="outline" className="shrink-0 text-muted-foreground">
                            Archived
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm leading-snug text-muted-foreground break-words">
                        {p.property_address?.trim() || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Job date</span>
                        <span className="mx-1.5 text-border">·</span>
                        {formatProjectJobDate(p.job_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center self-center text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden>
                      <ChevronRight className="size-5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="lg:sticky lg:top-6 lg:z-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Timeline</CardTitle>
                <CardDescription>Filter and search events</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex"
                type="button"
                onClick={() => setAddNoteOpen(true)}
              >
                Add note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="search"
                  placeholder="Search events..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="h-9 w-full"
                />
                <Select value={timelineFilter || "__all__"} onValueChange={(v) => setTimelineFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All categories</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Object.keys(eventsByDate).length === 0 ? (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">No events yet</EmptyTitle>
                    <EmptyDescription>Add a note or activity will appear here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                  {Object.entries(eventsByDate)
                    .sort(([a], [b]) => (b > a ? 1 : -1))
                    .map(([date, dayEvents]) => (
                      <div key={date} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-card/95 backdrop-blur py-1 z-[1]">
                          {formatDateLabel(date)}
                        </p>
                        <ul className="space-y-0">
                          {dayEvents.map((e) => (
                            <li
                              key={e.id}
                              className={TIMELINE_EVENT_ROW_CLASS}
                              title={formatDate(e.created_at)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="break-words font-medium leading-snug text-foreground">
                                  {timelineDescriptionWithoutTrailingAttribution(e.event_description, e.created_by_name)}
                                </span>
                                <span className={TIMELINE_CATEGORY_LABEL_CLASS} title={e.event_category}>
                                  {CATEGORY_LABEL[e.event_category] ?? e.event_category}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                                {e.created_by_name} · {e.created_by_role} · {formatTime(e.created_at)}
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

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete this client and all of their projects and timeline history. This cannot be undone. The
                linked contact will be marked Closed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteConfirmName(""); setDeleteOpen(true); }}>
                Permanently delete client
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteOpen(false);
            setDeleteConfirmName("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete client?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  All projects and timeline events for this client will be deleted. The linked contact will be marked{" "}
                  <strong>Closed</strong>.
                </p>
                <p className="text-sm">
                  Type <strong>{displayFullName}</strong> to confirm.
                </p>
                <Input
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="off"
                  disabled={deleting}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting || !deleteNameMatches} onClick={handlePermanentDelete}>
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>This will be logged to the client timeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Enter note..." rows={4} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>{addingNote ? "Adding..." : "Add note"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
