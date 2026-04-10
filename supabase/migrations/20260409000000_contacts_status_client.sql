-- Allow contacts.status = 'client' (post-conversion label); backfill from converted + converted_to_client.

ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('new', 'contacted', 'responded', 'converted', 'client', 'dead', 'no_fit'));

UPDATE public.contacts
SET status = 'client'
WHERE converted_to_client = true AND status = 'converted';
