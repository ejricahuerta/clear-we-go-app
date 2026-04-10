-- Allow contacts.found_via = 'quo' (Quo lead source).

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_found_via_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_found_via_check
  CHECK (
    found_via IS NULL
    OR found_via IN (
      'apollo',
      'linkedin',
      'realtor_ca',
      'lsoo',
      'referral',
      'quo',
      'other'
    )
  );
