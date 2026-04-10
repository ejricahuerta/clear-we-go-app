"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format, isValid, parse } from "date-fns";
import { Users, ListChecks, History, ImagePlus, PanelRight, Calendar, KeyRound } from "lucide-react";
import { useProjectBreadcrumb } from "@/components/project-breadcrumb-context";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PROJECT_STAGE_LABELS, PROJECT_STAGES } from "@/lib/projects/stages";
import {
  TIMELINE_CATEGORY_LABEL_CLASS,
  TIMELINE_EVENT_ROW_CLASS,
  timelineDescriptionWithoutTrailingAttribution,
} from "@/lib/timeline-display";
import { ProjectNotesEditor } from "@/components/projects/project-notes-editor";
import { ProjectAccessPanel } from "@/components/projects/project-access-panel";
import {
  ProjectPropertiesPanel,
  type ProjectForPropertiesPanel as Project,
} from "@/components/projects/project-properties-panel";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const STAGES = [...PROJECT_STAGES] as string[];
const STAGE_LABELS: Record<string, string> = { ...PROJECT_STAGE_LABELS };

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

const LG_MEDIA = "(min-width: 1024px)";

/** Fields edited in the properties panel — used to detect unsaved edits without reacting to notes (separate autosave). */
function serializeProjectPropertiesSnapshot(p: Project): string {
  return JSON.stringify({
    stage: p.stage,
    property_address: p.property_address,
    neighbourhood: p.neighbourhood,
    property_size: p.property_size,
    job_date: p.job_date,
    start_time: p.start_time,
    quote_amount: p.quote_amount,
    invoice_amount: p.invoice_amount,
    pinned: p.pinned,
  });
}

function useMediaQueryLg() {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(LG_MEDIA);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(LG_MEDIA).matches : false),
    () => false
  );
}

function ProjectJobTimelineSection({
  projectId,
  timelineEvents,
}: {
  projectId: string;
  timelineEvents: TimelineEvent[];
}) {
  const UNKNOWN_DATE_KEY = "__unknown__";
  const safeDate = (d: string | null | undefined): Date | null => {
    if (d == null || String(d).trim() === "") return null;
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const formatDateOnly = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    if (!parsed) return UNKNOWN_DATE_KEY;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const formatDateTime = (d: string | null | undefined): string => {
    const parsed = safeDate(d);
    return parsed
      ? parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
  };
  const formatDateLabel = (dateKey: string): string => {
    if (dateKey === UNKNOWN_DATE_KEY) return "Unknown date";
    const d = new Date(dateKey + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "Unknown date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "Today";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const timelineByDate = useMemo(
    () =>
      timelineEvents.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
        const date = formatDateOnly(e.created_at);
        if (!acc[date]) acc[date] = [];
        acc[date].push(e);
        return acc;
      }, {}),
    [timelineEvents]
  );

  const timelineDateEntries = useMemo(
    () => Object.entries(timelineByDate).sort(([a], [b]) => (b > a ? 1 : -1)),
    [timelineByDate]
  );

  const [openDates, setOpenDates] = useState<string[]>([]);
  const accordionSigRef = useRef<{ projectId: string; sig: string }>({ projectId: "", sig: "" });

  useEffect(() => {
    const keys = timelineDateEntries.map(([d]) => d);
    const sig = keys.join("\0");
    if (keys.length === 0) {
      setOpenDates([]);
      accordionSigRef.current = { projectId, sig: "" };
      return;
    }
    const ref = accordionSigRef.current;
    if (ref.projectId !== projectId) {
      accordionSigRef.current = { projectId, sig };
      setOpenDates([]);
      return;
    }
    if (ref.sig !== sig) {
      accordionSigRef.current = { projectId, sig };
      setOpenDates((open) => open.filter((k) => keys.includes(k)));
    }
  }, [projectId, timelineDateEntries]);

  return (
    <section className="border-t border-border/60 pt-10" aria-labelledby="job-timeline-heading">
      <h2 id="job-timeline-heading" className="text-base font-semibold tracking-tight text-foreground">
        Timeline
      </h2>
      <div className="mt-5">
        {timelineDateEntries.length === 0 ? (
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History className="size-5" />
              </EmptyMedia>
              <EmptyTitle className="text-base">No events yet</EmptyTitle>
              <EmptyDescription>Stage changes and activity will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Accordion
            type="multiple"
            className="w-full border-t border-border/60"
            value={openDates}
            onValueChange={setOpenDates}
          >
            {timelineDateEntries.map(([date, dayEvents]) => (
              <AccordionItem key={date} value={date} className="border-border/60">
                <AccordionTrigger className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline [&[data-state=open]]:text-foreground">
                  <span className="flex flex-1 items-center gap-2 text-left">
                    {formatDateLabel(date)}
                    <span className="text-[10px] font-normal normal-case tabular-nums text-muted-foreground/80">
                      {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-0">
                  <ul className="space-y-0 pb-1">
                    {dayEvents.map((e) => (
                      <li
                        key={e.id}
                        className={TIMELINE_EVENT_ROW_CLASS}
                        title={formatDateTime(e.created_at)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="break-words font-medium leading-snug text-foreground">
                            {timelineDescriptionWithoutTrailingAttribution(
                              e.event_description,
                              e.created_by_name
                            )}
                          </span>
                          <span
                            className={TIMELINE_CATEGORY_LABEL_CLASS}
                            title={e.event_category}
                          >
                            {CATEGORY_LABEL[e.event_category] ?? e.event_category}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                          {e.created_by_name} · {e.created_by_role} · {formatDateTime(e.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}

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
  const [propertiesSaveHint, setPropertiesSaveHint] = useState<"idle" | "saved" | "error">("idle");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [canManageProject, setCanManageProject] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [lockboxVisible, setLockboxVisible] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [crewSheetOpen, setCrewSheetOpen] = useState(false);
  const [checklistSheetOpen, setChecklistSheetOpen] = useState(false);
  const { setProjectBreadcrumb } = useProjectBreadcrumb();
  const isLg = useMediaQueryLg();
  const lastSavedPropertiesRef = useRef("");
  const projectRef = useRef<Project | null>(null);
  projectRef.current = project;

  const load = useCallback(() => {
    return Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/access`).then((r) => r.json()).catch(() => ({ access: null })),
      fetch(`/api/projects/${id}/crew`).then((r) => r.json()).catch(() => ({ crew: [], available: [], unavailable: [], all: [], job_date: null })),
      fetch(`/api/projects/${id}/checklist`).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(`/api/projects/${id}/timeline`).then((r) => r.json()).catch(() => ({ events: [] })),
    ])
      .then(([projData, accessData, crewResp, checklistResp, timelineResp]) => {
        if (projData.error) {
          setProject(null);
          return;
        }
        setProject({ ...projData, pinned: Boolean(projData.pinned) });
        lastSavedPropertiesRef.current = serializeProjectPropertiesSnapshot(projData as Project);
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
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !project || project.id !== id) {
      setProjectBreadcrumb(null);
      return;
    }
    setProjectBreadcrumb({
      clientId: project.client_id,
      clientName: project.client_name ?? "Client",
      propertyAddress: project.property_address,
    });
    return () => setProjectBreadcrumb(null);
  }, [id, loading, project, setProjectBreadcrumb]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role === "owner" || data?.role === "admin") setCanManageProject(true);
      })
      .catch(() => setCanManageProject(false));
  }, []);

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
    setProject((prev) => (prev ? { ...prev, stage: newStage } : prev));
  };

  const persistProjectProperties = useCallback(async () => {
    const p = projectRef.current;
    if (!p || p.id !== id) return;
    const snap = serializeProjectPropertiesSnapshot(p);
    if (snap === lastSavedPropertiesRef.current) return;
    setSaving(true);
    setPropertiesSaveHint("idle");
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
      window.dispatchEvent(new Event("clearwego-sidebar-projects"));
      setPropertiesSaveHint("saved");
      window.setTimeout(() => setPropertiesSaveHint("idle"), 2000);
    } catch (e) {
      console.error(e);
      setPropertiesSaveHint("error");
      window.setTimeout(() => setPropertiesSaveHint("idle"), 5000);
    } finally {
      setSaving(false);
    }
  }, [id, load]);

  useEffect(() => {
    if (!project || project.id !== id) return;
    const snap = serializeProjectPropertiesSnapshot(project);
    if (snap === lastSavedPropertiesRef.current) return;
    const t = window.setTimeout(() => {
      void persistProjectProperties();
    }, 650);
    return () => window.clearTimeout(t);
  }, [project, id, persistProjectProperties]);

  const handleSaveAccess = () => {
    setAccessSaving(true);
    fetch(`/api/projects/${id}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(access),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) throw new Error(data.error);
        setAccessDialogOpen(false);
        return load();
      })
      .catch(console.error)
      .finally(() => setAccessSaving(false));
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

  if (loading) {
    return <LoadingSpinner fullPage />;
  }
  if (!project) return <div className="p-6">Project not found.</div>;

  const serviceLabel = (s: string | null) => (s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-");
  const jobDateParsed = project.job_date ? parse(project.job_date, "yyyy-MM-dd", new Date()) : null;
  const jobDateSummary =
    jobDateParsed && isValid(jobDateParsed) ? format(jobDateParsed, "EEE, MMM d, yyyy") : null;
  const jobTimeSummary = project.start_time?.trim() ? project.start_time.trim().slice(0, 5) : null;
  const jobScheduleLine = [jobDateSummary, jobTimeSummary].filter(Boolean).join(" · ") || "No job date or start time";

  const mainColumn = (
    <>
      {project.archived_at != null && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-50/80 px-4 py-3 text-sm text-foreground dark:bg-amber-950/30">
          <p className="font-medium">This project is archived</p>
          <p className="mt-1 text-muted-foreground">
            It does not appear on the main projects list. Open this page from the client record or a bookmark to view it.
          </p>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {project.property_address}
        </h1>
        <div className="mt-0.5 flex shrink-0 items-center justify-end sm:mt-1">
          <Badge
            variant="primaryGhost"
            className="h-8 w-fit shrink-0 rounded-full px-3 py-0 text-xs font-semibold"
          >
            {STAGE_LABELS[project.stage] ?? project.stage}
          </Badge>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 lg:hidden"
          onClick={() => setPropertiesOpen(true)}
        >
          <PanelRight className="size-4 shrink-0" aria-hidden />
          Details
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 gap-0 px-0 sm:w-auto sm:gap-2 sm:px-3"
          aria-label="Crew"
          onClick={() => {
            setChecklistSheetOpen(false);
            setCrewSheetOpen(true);
          }}
        >
          <Users className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Crew</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 gap-0 px-0 sm:w-auto sm:gap-2 sm:px-3"
          aria-label={
            checklistItems.length > 0
              ? `Checklist, ${checklistItems.filter((i) => i.completed).length} of ${checklistItems.length} complete`
              : "Checklist"
          }
          onClick={() => {
            setCrewSheetOpen(false);
            setChecklistSheetOpen(true);
          }}
        >
          <ListChecks className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Checklist</span>
          {checklistItems.length > 0 ? (
            <span className="hidden rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground sm:inline">
              {checklistItems.filter((i) => i.completed).length}/{checklistItems.length}
            </span>
          ) : null}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 gap-0 px-0 sm:w-auto sm:gap-2 sm:px-3"
          aria-label="Site access"
          onClick={() => {
            setCrewSheetOpen(false);
            setChecklistSheetOpen(false);
            setAccessDialogOpen(true);
          }}
        >
          <KeyRound className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Access</span>
        </Button>
        <div
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-input bg-transparent text-xs text-muted-foreground sm:w-auto sm:gap-2 sm:px-3"
          role="status"
          aria-label="Photo upload — not available yet"
        >
          <ImagePlus className="size-4 shrink-0 opacity-70" aria-hidden />
          <span className="hidden sm:inline">Upload photos</span>
        </div>
      </div>
      <p className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="tabular-nums">{jobScheduleLine}</span>
      </p>

      <section className="border-t border-border pt-8" aria-labelledby="project-notes-heading">
        <h2
          id="project-notes-heading"
          className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Notes
        </h2>
        <ProjectNotesEditor
          key={id}
          projectId={id}
          initialMarkdown={project.notes}
          onSaved={(md) => setProject((p) => (p ? { ...p, notes: md } : p))}
        />
      </section>

      <ProjectJobTimelineSection projectId={id} timelineEvents={timelineEvents} />
    </>
  );

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-0">
      {!isLg ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-card">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            {mainColumn}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup id={`project-layout-${id}`} orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="64%" minSize="28%" className="min-w-0">
            <div className="flex h-full min-h-0 flex-col bg-card">
              <div className="min-h-0 flex-1 overflow-y-auto border-r border-border">
                <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-10">
                  {mainColumn}
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="mx-0.5 bg-muted/30" />
          <ResizablePanel defaultSize="36%" minSize="22%" className="min-w-0">
            <aside className="flex h-full min-h-0 flex-col overflow-y-auto bg-card">
              <div className="sticky top-0 z-10 border-b border-border/80 bg-card px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">Properties</h2>
                    <p className="text-xs text-muted-foreground">Job details & billing — saves as you type</p>
                  </div>
                  <p
                    className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground"
                    aria-live="polite"
                  >
                    {saving ? "Saving…" : propertiesSaveHint === "saved" ? "Saved" : propertiesSaveHint === "error" ? "Couldn't save" : ""}
                  </p>
                </div>
              </div>
              {deleteError && !deleteDialogOpen && canManageProject ? (
                <div className="border-b border-destructive/25 bg-destructive/5 px-6 py-2.5">
                  <p className="text-sm font-medium text-destructive" role="alert">
                    {deleteError}
                  </p>
                </div>
              ) : null}
              <div className="px-5 py-5">
                <ProjectPropertiesPanel
                  idPrefix="sidebar"
                  project={project}
                  setProject={setProject}
                  serviceLabel={serviceLabel}
                  stages={STAGES}
                  stageLabels={STAGE_LABELS}
                  onStageChange={handleStageChange}
                  fieldsDisabled={saving}
                  canManagePinned={canManageProject}
                />
                {canManageProject ? (
                  <div className="mt-8 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                    <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Permanently delete this project and its checklist, crew assignments, and access details. The client
                      timeline will record the deletion. This cannot be undone.
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                      disabled={deleting || saving}
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete project
                    </Button>
                  </div>
                ) : null}
              </div>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <Sheet
        open={crewSheetOpen}
        onOpenChange={(open) => {
          setCrewSheetOpen(open);
          if (open) setChecklistSheetOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <SheetHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
            <SheetTitle>Crew</SheetTitle>
            <SheetDescription>Assign people to this job. Set a job date under Details to see availability.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crew assignment</CardTitle>
                <CardDescription>
                  {crewData?.job_date
                    ? `Job date: ${new Date(crewData.job_date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}.`
                    : "Set a job date under Details to see who is available."}
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
                              className="flex list-none items-center justify-between rounded-md border px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{member.name}</span>
                              <span className="ml-2 truncate text-muted-foreground">{member.email}</span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="ml-2 shrink-0"
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
                                className="flex items-center justify-between rounded-md border border-green-200 px-3 py-2 text-sm dark:border-green-900/50"
                              >
                                <span className="font-medium">{member.name}</span>
                                <span className="ml-2 truncate text-muted-foreground">{member.email}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="ml-2 shrink-0"
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
                                className="flex items-center justify-between rounded-md border border-amber-200 px-3 py-2 text-sm dark:border-amber-900/50"
                              >
                                <div className="min-w-0">
                                  <span className="font-medium">{member.name}</span>
                                  <span className="ml-2 truncate text-muted-foreground">{member.email}</span>
                                  {member.unavailableReason && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">{member.unavailableReason}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 shrink-0 opacity-70"
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
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={checklistSheetOpen}
        onOpenChange={(open) => {
          setChecklistSheetOpen(open);
          if (open) setCrewSheetOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <SheetHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
            <SheetTitle>Checklist</SheetTitle>
            <SheetDescription>
              Service-specific tasks for this job. Items are created when the project is created with a service type.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist</CardTitle>
                <CardDescription>
                  {checklistItems.length > 0
                    ? `${checklistItems.filter((i) => i.completed).length} of ${checklistItems.length} complete`
                    : "No items yet for this project."}
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
                          id={`checklist-sheet-${item.id}`}
                          checked={item.completed}
                          disabled={checklistToggling === item.id}
                          onCheckedChange={(checked) => handleChecklistToggle(item.id, checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor={`checklist-sheet-${item.id}`} className="flex-1 cursor-pointer">
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
          </div>
        </SheetContent>
      </Sheet>
    </div>

    <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <SheetTitle>Details</SheetTitle>
              <SheetDescription>
                Job details and billing — saves as you type. Use Access on the main view for keys and site access.
              </SheetDescription>
            </div>
            <p
              className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {saving ? "Saving…" : propertiesSaveHint === "saved" ? "Saved" : propertiesSaveHint === "error" ? "Couldn't save" : ""}
            </p>
          </div>
        </SheetHeader>
        {deleteError && !deleteDialogOpen && canManageProject ? (
          <div className="border-b border-destructive/25 bg-destructive/5 px-6 py-2.5">
            <p className="text-sm font-medium text-destructive" role="alert">
              {deleteError}
            </p>
          </div>
        ) : null}
        <div className="px-5 py-5">
          {propertiesOpen ? (
            <ProjectPropertiesPanel
              idPrefix="mobile"
              project={project}
              setProject={setProject}
              serviceLabel={serviceLabel}
              stages={STAGES}
              stageLabels={STAGE_LABELS}
              onStageChange={handleStageChange}
              fieldsDisabled={saving}
              canManagePinned={canManageProject}
            />
          ) : null}
          {propertiesOpen && canManageProject ? (
            <div className="mb-6 mt-6 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanently delete this project and its checklist, crew assignments, and access details. The client timeline
                will record the deletion. This cannot be undone.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-3"
                disabled={deleting || saving}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete project
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] max-w-lg flex-col gap-0 border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl sm:max-w-lg dark:border-neutral-200 dark:bg-neutral-50 dark:text-neutral-900">
        <DialogHeader className="border-b border-neutral-200 px-6 py-4 text-left">
          <DialogTitle>Site access</DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-neutral-600 dark:text-neutral-600">
              Keys, lockbox, building and parking notes.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4 text-neutral-900 dark:bg-neutral-50 [&_.text-muted-foreground]:text-neutral-600">
          <ProjectAccessPanel
            idPrefix="access-dialog"
            access={access}
            setAccess={setAccess}
            accessTypes={ACCESS_TYPES}
            lockboxVisible={lockboxVisible}
            setLockboxVisible={setLockboxVisible}
          />
        </div>
        <DialogFooter className="border-t border-neutral-200 bg-white px-6 py-4 sm:justify-end dark:bg-neutral-50">
          <Button type="button" variant="outline" onClick={() => setAccessDialogOpen(false)} disabled={accessSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSaveAccess()} loading={accessSaving} disabled={accessSaving}>
            Save access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete project permanently?</DialogTitle>
            <DialogDescription asChild>
              <p className="text-sm text-muted-foreground">
                This removes the project and related checklist, crew assignments, and access details. The client timeline will record the deletion. This cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <DialogFooter className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProject} loading={deleting} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
