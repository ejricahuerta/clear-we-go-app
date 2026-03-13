-- Allow CASCADE deletes from clients into timeline_events while keeping
-- timeline_events append-only for direct updates/deletes.
-- Uses a transaction-local flag set by triggers on clients.

-- 1) Allow DELETE on timeline_events when flag is set (cascade from clients)
CREATE OR REPLACE FUNCTION public.prevent_timeline_events_update_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
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

-- 2) On clients BEFORE DELETE: set flag so CASCADE deletes on timeline_events are allowed
CREATE OR REPLACE FUNCTION public.set_allow_timeline_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_timeline_cascade', 'true', true);
  RETURN OLD;
END;
$$;

-- 3) On clients AFTER DELETE: clear flag
CREATE OR REPLACE FUNCTION public.unset_allow_timeline_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_timeline_cascade', 'false', true);
  RETURN NULL;
END;
$$;

CREATE TRIGGER clients_before_delete_allow_timeline_cascade
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_allow_timeline_cascade();

CREATE TRIGGER clients_after_delete_unset_timeline_cascade
  AFTER DELETE ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE public.unset_allow_timeline_cascade();
