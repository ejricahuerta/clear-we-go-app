-- Clear We Go — Append-only timeline_events; audit_log no deletes (docs/02, 03)

-- timeline_events: no UPDATE or DELETE ever (append-only)
CREATE OR REPLACE FUNCTION public.prevent_timeline_events_update_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'timeline_events is append-only: updates and deletes are not allowed';
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER timeline_events_append_only
  BEFORE UPDATE OR DELETE ON public.timeline_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_timeline_events_update_delete();

-- audit_log: no DELETE ever (only system inserts; owner can read)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log cannot be deleted';
END;
$$;

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_audit_log_delete();
