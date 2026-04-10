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

export function isProjectStage(s: string): s is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(s);
}
