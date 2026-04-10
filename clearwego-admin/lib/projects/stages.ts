/** Execution pipeline on `projects.stage` (DB CHECK must match). */
export const PROJECT_STAGES = [
  "todo",
  "scheduled",
  "in_progress",
  "cleared",
  "report_sent",
  "review_requested",
  "closed",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  todo: "Todo",
  scheduled: "Scheduled",
  in_progress: "In progress",
  cleared: "Cleared",
  report_sent: "Report sent",
  review_requested: "Review requested",
  closed: "Close the project",
};

/** Extra classes on `<Badge variant="secondary" />` for stage chips. */
export const PROJECT_STAGE_BADGE_CLASS: Record<ProjectStage, string> = {
  todo: "bg-muted text-muted-foreground",
  scheduled: "bg-sky-100 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100",
  in_progress: "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
  cleared:
    "bg-primary text-primary-foreground shadow hover:bg-primary/80 dark:hover:bg-primary/80",
  report_sent: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  review_requested: "bg-orange-100 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100",
  closed: "bg-primary/15 text-primary dark:bg-primary/25",
};

export function isProjectStage(s: string): s is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(s);
}

/** In-progress jobs always appear under Important in the admin sidebar (even without manual pin). */
export function isAutoSidebarImportantStage(stage: string): boolean {
  return stage === "in_progress";
}
