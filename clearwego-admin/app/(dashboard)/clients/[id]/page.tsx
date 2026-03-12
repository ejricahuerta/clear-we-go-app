"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";

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
  created_at: string;
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
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 rounded-md mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="lg:sticky lg:top-6">
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!client) return <div className="p-6">Client not found.</div>;

  const formatDate = (d: string) => new Date(d).toLocaleString();
  const formatDateOnly = (d: string) => new Date(d).toLocaleDateString();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{client.first_name} {client.last_name}</h1>
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
            <div className="sm:col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} rows={3} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects</CardTitle>
          <CardDescription>Total revenue (paid): ${totalRevenue.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="font-medium">{p.service_type?.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{p.property_address}</span>
                  <span className="text-muted-foreground">({p.stage})</span>
                  <Link href={`/projects/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

        </div>
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Timeline</CardTitle>
                <CardDescription>Filter and search events</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddNoteOpen(true)}>Add note</Button>
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
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <p className="text-sm text-muted-foreground">No events yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add a note or activity will appear here</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                  {Object.entries(eventsByDate)
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
                              title={formatDate(e.created_at)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium leading-snug break-words">{e.event_description}</span>
                                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground" title={e.event_category}>
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
      </div>

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
