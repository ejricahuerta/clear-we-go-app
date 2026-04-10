-- Pin high-priority active projects to the admin sidebar ("Important" group).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.pinned IS 'When true, project is listed under Important in the admin sidebar (non-closed, non-archived jobs).';

CREATE INDEX IF NOT EXISTS idx_projects_pinned_sidebar
  ON public.projects (pinned)
  WHERE archived_at IS NULL AND pinned = true;
