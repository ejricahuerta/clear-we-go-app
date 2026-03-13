"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatServiceType, formatTime, formatNextJobDate, ACCESS_TYPE_LABELS } from "@/lib/crew-jobs";

type Assignment = { project_id: string; job_date: string; start_time: string | null };
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
  project_id: string;
  access_type: string | null;
  lockbox_code: string | null;
  building_instructions: string | null;
  parking_instructions: string | null;
};

function todayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function TodayPage() {
  const [todayJobs, setTodayJobs] = useState<
    { project: Project; access: ProjectAccess | null; displayTime: string }[]
  >([]);
  const [nextJob, setNextJob] = useState<{
    project: Project;
    job_date: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const today = todayDateString();

    (async () => {
      setError(null);
      try {
        const { data: assignments, error: assignErr } = await supabase
          .from("crew_assignments")
          .select("project_id, job_date, start_time")
          .eq("job_date", today);

        if (assignErr) {
          setError(assignErr.message);
          setLoading(false);
          return;
        }

        const list = (assignments ?? []) as Assignment[];
        const projectIds = Array.from(new Set(list.map((a) => a.project_id)));

        if (projectIds.length === 0) {
          const { data: nextAssign } = await supabase
            .from("crew_assignments")
            .select("project_id, job_date")
            .gt("job_date", today)
            .order("job_date", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (nextAssign?.project_id) {
            const { data: proj } = await supabase
              .from("projects")
              .select("id, service_type, property_address, job_date, start_time, notes, stage")
              .eq("id", (nextAssign as { project_id: string }).project_id)
              .single();
            if (proj) {
              setNextJob({
                project: proj as Project,
                job_date: (nextAssign as { job_date: string }).job_date,
              });
            }
          }
          setTodayJobs([]);
          setLoading(false);
          return;
        }

        const [{ data: projects }, { data: accessList }] = await Promise.all([
          supabase
            .from("projects")
            .select("id, service_type, property_address, job_date, start_time, notes, stage")
            .in("id", projectIds),
          supabase.from("project_access").select("project_id, access_type, lockbox_code, building_instructions, parking_instructions").in("project_id", projectIds),
        ]);

        const accessByProject = new Map<string, ProjectAccess>();
        (accessList ?? []).forEach((a: ProjectAccess) => accessByProject.set(a.project_id, a));
        const projectMap = new Map<string, Project>();
        (projects ?? []).forEach((p: Project) => projectMap.set(p.id, p));

        const assignmentByProject = new Map<string, Assignment>();
        list.forEach((a) => assignmentByProject.set(a.project_id, a));

        const jobs: { project: Project; access: ProjectAccess | null; displayTime: string }[] = [];
        list.forEach((a) => {
          const project = projectMap.get(a.project_id);
          if (!project) return;
          const displayTime = a.start_time
            ? formatTime(a.start_time)
            : formatTime(project.start_time);
          jobs.push({
            project,
            access: accessByProject.get(a.project_id) ?? null,
            displayTime,
          });
        });

        jobs.sort((a, b) => a.displayTime.localeCompare(b.displayTime));
        setTodayJobs(jobs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Today</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your assigned jobs</p>
        <p className="text-muted-foreground mt-6 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Today</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your assigned jobs</p>
        <p className="text-destructive mt-6 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Today</h1>
      <p className="text-muted-foreground mt-1 text-sm">Your assigned jobs</p>

      {todayJobs.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <p className="text-base font-medium">No jobs scheduled today.</p>
          {nextJob && (
            <p className="mt-2 text-sm text-muted-foreground">
              Next job: {formatNextJobDate(nextJob.job_date, nextJob.project.service_type)}
              <br />
              <span className="text-foreground">{nextJob.project.property_address}</span>
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {todayJobs.map(({ project, access, displayTime }) => (
            <li
              key={project.id}
              className="rounded-lg border border-border bg-card p-4 text-card-foreground"
            >
              <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {formatServiceType(project.service_type)}
              </span>
              <p className="mt-2 text-base font-medium text-foreground">
                {project.property_address}
              </p>
              <p className="text-sm text-muted-foreground">{displayTime}</p>
              {project.notes?.trim() && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Client instructions:
                  </p>
                  <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap">
                    {project.notes.trim()}
                  </p>
                </div>
              )}
              {access && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Access:{" "}
                  {access.access_type
                    ? ACCESS_TYPE_LABELS[access.access_type] ?? access.access_type.replace(/_/g, " ")
                    : "—"}
                  {access.access_type === "lockbox" && access.lockbox_code
                    ? " – code in app"
                    : ""}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <Link href={`/jobs/${project.id}`}>
                  <Button variant="outline" size="default" className="min-h-[44px] w-full">
                    View access details
                  </Button>
                </Link>
                <Link href={`/jobs/${project.id}`}>
                  <Button size="default" className="min-h-[44px] w-full">
                    Start job
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
