"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatServiceType, formatTime, formatDate } from "@/lib/crew-jobs";

type Assignment = { project_id: string; job_date: string; start_time: string | null };
type Project = {
  id: string;
  service_type: string;
  property_address: string;
  job_date: string | null;
  start_time: string | null;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function UpcomingPage() {
  const [jobs, setJobs] = useState<{ project: Project; job_date: string; displayTime: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const today = todayDateString();

    (async () => {
      setError(null);
      try {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        const endDateStr = endDate.toISOString().slice(0, 10);

        const { data: assignments, error: assignErr } = await supabase
          .from("crew_assignments")
          .select("project_id, job_date, start_time")
          .gt("job_date", today)
          .lte("job_date", endDateStr)
          .order("job_date", { ascending: true });

        if (assignErr) {
          setError(assignErr.message);
          setLoading(false);
          return;
        }

        const list = (assignments ?? []) as Assignment[];
        if (list.length === 0) {
          setJobs([]);
          setLoading(false);
          return;
        }

        const projectIds = Array.from(new Set(list.map((a) => a.project_id)));
        const { data: projects } = await supabase
          .from("projects")
          .select("id, service_type, property_address, job_date, start_time")
          .in("id", projectIds);

        const projectMap = new Map<string | number, Project>();
        (projects ?? []).forEach((p: Project) => projectMap.set(p.id, p));

        const result = list.map((a) => {
          const project = projectMap.get(a.project_id);
          const displayTime = a.start_time
            ? formatTime(a.start_time)
            : project
              ? formatTime(project.start_time)
              : "—";
          return {
            project: project!,
            job_date: a.job_date,
            displayTime,
          };
        }).filter((r) => r.project);

        setJobs(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load upcoming jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Upcoming</h1>
        <p className="text-muted-foreground mt-1 text-sm">Next 7 days of assigned jobs</p>
        <p className="text-muted-foreground mt-6 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Upcoming</h1>
        <p className="text-muted-foreground mt-1 text-sm">Next 7 days of assigned jobs</p>
        <p className="text-destructive mt-6 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Upcoming</h1>
      <p className="text-muted-foreground mt-1 text-sm">Next 7 days of assigned jobs</p>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">No upcoming jobs assigned.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map(({ project, job_date, displayTime }) => (
            <li
              key={`${project.id}-${job_date}`}
              className="rounded-lg border border-border bg-card p-4 text-card-foreground"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {formatDate(job_date)} · {displayTime}
              </p>
              <p className="mt-0.5 text-base font-medium text-foreground">
                {formatServiceType(project.service_type)}
              </p>
              <p className="text-sm text-muted-foreground">{project.property_address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
