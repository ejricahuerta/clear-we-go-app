-- Let client/project deletes complete: optional FKs no longer block CASCADE/SET NULL.
-- invoices/receipts/sms_log referenced clients/projects without ON DELETE behavior (defaults to NO ACTION).

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.receipts
  DROP CONSTRAINT IF EXISTS receipts_client_id_fkey;
ALTER TABLE public.receipts
  ADD CONSTRAINT receipts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.receipts
  DROP CONSTRAINT IF EXISTS receipts_project_id_fkey;
ALTER TABLE public.receipts
  ADD CONSTRAINT receipts_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.sms_log
  DROP CONSTRAINT IF EXISTS sms_log_client_id_fkey;
ALTER TABLE public.sms_log
  ADD CONSTRAINT sms_log_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Permanent client delete: unlink contacts (No Fit), delete all projects for client, then client row.
-- SECURITY DEFINER so RLS on owner-only tables does not block FK-driven updates during deletes.
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
  SET status = 'no_fit', client_id = NULL, converted_to_client = false
  WHERE client_id = p_client_id;

  IF v_contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET status = 'no_fit', client_id = NULL, converted_to_client = false
    WHERE id = v_contact_id;
  END IF;

  DELETE FROM public.projects WHERE client_id = p_client_id;
  DELETE FROM public.clients WHERE id = p_client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_client_permanently(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_client_permanently(uuid) TO authenticated;
