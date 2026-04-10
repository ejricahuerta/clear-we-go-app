-- Remove contacts.status = 'converted'. Map existing rows, then tighten CHECK.

ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_status_check;

UPDATE public.contacts
SET status = 'client'
WHERE status = 'converted'
  AND (converted_to_client = true OR client_id IS NOT NULL);

UPDATE public.contacts
SET status = 'responded'
WHERE status = 'converted';

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN (
    'new', 'contacted', 'responded', 'client', 'archived', 'reopened'
  ));
