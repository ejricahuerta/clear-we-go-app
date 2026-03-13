"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  formatServiceType,
  formatTime,
  ACCESS_TYPE_LABELS,
} from "@/lib/crew-jobs";

type Project = {
  id: string;
  service_type: string;
  property_address: string;
  job_date: string | null;
  start_time: string | null;
  notes: string | null;
  stage: string;
};
type ProjectAccess = {
  id: string;
  project_id: string;
  access_type: string | null;
  lockbox_code: string | null;
  building_instructions: string | null;
  parking_instructions: string | null;
};
type ChecklistItem = {
  id: string;
  item_text: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [access, setAccess] = useState<ProjectAccess | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [displayTime, setDisplayTime] = useState<string>("—");
  const [accessExpanded, setAccessExpanded] = useState(false);
  const [lockboxRevealed, setLockboxRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    const supabase = createClient();

    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .select("id, service_type, property_address, job_date, start_time, notes, stage")
      .eq("id", id)
      .single();

    if (projErr || !proj) {
      setError(projErr?.message ?? "Project not found");
      setLoading(false);
      return;
    }

    setProject(proj as Project);
    setDisplayTime(formatTime((proj as Project).start_time));

    const { data: assign } = await supabase
      .from("crew_assignments")
      .select("start_time")
      .eq("project_id", id)
      .maybeSingle();
    if ((assign as { start_time?: string } | null)?.start_time) {
      setDisplayTime(formatTime((assign as { start_time: string }).start_time));
    }

    const { data: acc } = await supabase
      .from("project_access")
      .select("id, project_id, access_type, lockbox_code, building_instructions, parking_instructions")
      .eq("project_id", id)
      .maybeSingle();
    setAccess(acc as ProjectAccess | null);

    const res = await fetch(`/api/projects/${id}/checklist`);
    const json = await res.json();
    if (res.ok && Array.isArray(json.items)) {
      setChecklist(json.items);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  async function toggleChecklistItem(item: ChecklistItem) {
    if (item.completed) return;
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/projects/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, completed: true }),
      });
      const updated = await res.json();
      if (res.ok && updated?.id) {
        setChecklist((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  completed: true,
                  completed_by: updated.completed_by,
                  completed_at: updated.completed_at,
                }
              : i
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner message="Loading job…" className="p-0 min-h-[40vh]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to Today
        </Link>
        <p className="mt-4 text-destructive text-sm">{error ?? "Project not found"}</p>
      </div>
    );
  }

  const completedCount = checklist.filter((i) => i.completed).length;
  const totalCount = checklist.length;

  return (
    <div className="p-6 pb-8">
      <Link
        href="/"
        className="text-sm font-medium text-primary hover:underline min-h-[44px] inline-flex items-center"
      >
        ← Back to Today
      </Link>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {formatServiceType(project.service_type)}
        </span>
        <h1 className="mt-2 text-lg font-semibold text-foreground">
          {project.property_address}
        </h1>
        <p className="text-sm text-muted-foreground">{displayTime}</p>
        {project.notes?.trim() && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground">Client instructions</p>
            <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap">
              {project.notes.trim()}
            </p>
          </div>
        )}
      </div>

      {/* Access */}
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          Access:{" "}
          {access?.access_type
            ? ACCESS_TYPE_LABELS[access.access_type] ?? access.access_type.replace(/_/g, " ")
            : "—"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 min-h-[44px]"
          onClick={() => setAccessExpanded(!accessExpanded)}
        >
          {accessExpanded ? "Hide details" : "View access details"}
        </Button>
        {accessExpanded && access && (
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {access.lockbox_code && (
              <p>
                Lockbox code:{" "}
                <button
                  type="button"
                  onClick={() => setLockboxRevealed(!lockboxRevealed)}
                  className="font-mono text-foreground underline hover:no-underline min-h-[44px] inline-flex items-center"
                >
                  {lockboxRevealed ? access.lockbox_code : "Tap to reveal"}
                </button>
              </p>
            )}
            {access.building_instructions?.trim() && (
              <p>Building: {access.building_instructions}</p>
            )}
            {access.parking_instructions?.trim() && (
              <p>Parking: {access.parking_instructions}</p>
            )}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-foreground">Checklist</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {completedCount} of {totalCount} complete
        </p>
        {totalCount > 0 && (
          <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        )}
        <ul className="mt-4 space-y-1">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 min-h-[44px]"
            >
              <button
                type="button"
                onClick={() => toggleChecklistItem(item)}
                disabled={item.completed || togglingId === item.id}
                className="shrink-0 size-6 rounded border border-border flex items-center justify-center bg-background disabled:opacity-50"
                aria-label={item.completed ? "Completed" : "Mark complete"}
              >
                {item.completed ? (
                  <span className="text-primary font-bold">✓</span>
                ) : (
                  <span className="size-3 rounded-sm bg-muted" />
                )}
              </button>
              <span
                className={
                  item.completed
                    ? "text-sm text-muted-foreground line-through"
                    : "text-sm text-foreground"
                }
              >
                {item.item_text}
              </span>
            </li>
          ))}
        </ul>
        {checklist.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">No checklist items for this job.</p>
        )}
      </div>
    </div>
  );
}
