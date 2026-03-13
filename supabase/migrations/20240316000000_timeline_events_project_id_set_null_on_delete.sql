-- Allow project delete: set timeline_events.project_id to NULL when a project is deleted
-- so the "project deleted" event remains on the client timeline.
ALTER TABLE public.timeline_events
  DROP CONSTRAINT IF EXISTS timeline_events_project_id_fkey;

ALTER TABLE public.timeline_events
  ADD CONSTRAINT timeline_events_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
