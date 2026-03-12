-- Ensure one crew assignment per (project_id, user_id) for the admin Crew tab.
-- crew_assignments already exists; add unique constraint to avoid duplicates.

ALTER TABLE public.crew_assignments
  DROP CONSTRAINT IF EXISTS crew_assignments_project_user_unique;

ALTER TABLE public.crew_assignments
  ADD CONSTRAINT crew_assignments_project_user_unique UNIQUE (project_id, user_id);
