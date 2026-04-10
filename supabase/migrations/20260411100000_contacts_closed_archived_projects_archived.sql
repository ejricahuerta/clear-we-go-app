-- Contact status: merge dead + no_fit → closed; add reopened.
-- Soft-archive: contacts.archived_at, projects.archived_at (clients already have archived_at).
-- RPC: unlink contacts with status closed instead of no_fit.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

-- Drop the old CHECK before setting status = 'closed' (the previous constraint did not allow 'closed').
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_status_check;

UPDATE public.contacts
SET status = 'closed'
WHERE status IN ('dead', 'no_fit');

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN (
    'new', 'contacted', 'responded', 'converted', 'client', 'closed', 'reopened'
  ));

CREATE OR REPLACE FUNCTION public.delete_client_permanently(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  IF public.current_user_role() IS NULL OR public.current_user_role() NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT c.contact_id INTO v_contact_id FROM public.clients c WHERE c.id = p_client_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.contacts
  SET status = 'closed', client_id = NULL, converted_to_client = false
  WHERE client_id = p_client_id;

  IF v_contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET status = 'closed', client_id = NULL, converted_to_client = false
    WHERE id = v_contact_id;
  END IF;

  DELETE FROM public.projects WHERE client_id = p_client_id;
  DELETE FROM public.clients WHERE id = p_client_id;
END;
$$;
