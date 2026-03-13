-- Allow project delete: ON DELETE SET NULL on timeline_events.project_id does an UPDATE.
-- The append-only trigger blocks all UPDATEs; allow only this one (project_id -> null).

-- 1) Extend trigger to allow UPDATE when flag is set and only project_id is set to NULL
CREATE OR REPLACE FUNCTION public.prevent_timeline_events_update_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('app.allow_timeline_project_null', true) = 'true'
       AND OLD.project_id IS NOT NULL AND NEW.project_id IS NULL
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'timeline_events is append-only: updates are not allowed';
  ELSIF TG_OP = 'DELETE' THEN
    IF current_setting('app.allow_timeline_cascade', true) = 'true' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'timeline_events is append-only: deletes are not allowed';
  END IF;
  RETURN NULL;
END;
$$;

-- 2) On projects BEFORE DELETE: set flag so FK SET NULL can update timeline_events
CREATE OR REPLACE FUNCTION public.set_allow_timeline_project_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_timeline_project_null', 'true', true);
  RETURN OLD;
END;
$$;

-- 3) On projects AFTER DELETE: clear flag
CREATE OR REPLACE FUNCTION public.unset_allow_timeline_project_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_timeline_project_null', 'false', true);
  RETURN NULL;
END;
$$;

CREATE TRIGGER projects_before_delete_allow_timeline_project_null
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_allow_timeline_project_null();

CREATE TRIGGER projects_after_delete_unset_timeline_project_null
  AFTER DELETE ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.unset_allow_timeline_project_null();
