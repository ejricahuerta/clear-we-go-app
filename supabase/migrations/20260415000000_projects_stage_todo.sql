-- Initial project stage: todo (before scheduled / on-site work).

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_stage_check;

ALTER TABLE public.projects
  ALTER COLUMN stage SET DEFAULT 'todo';

ALTER TABLE public.projects
  ADD CONSTRAINT projects_stage_check
  CHECK (stage IN (
    'todo',
    'scheduled',
    'in_progress',
    'cleared',
    'report_sent',
    'review_requested',
    'closed'
  ));

COMMENT ON COLUMN public.projects.stage IS 'Execution pipeline; new rows default to todo.';
