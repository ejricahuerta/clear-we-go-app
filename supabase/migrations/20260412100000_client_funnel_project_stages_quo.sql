-- Client sales funnel (status + quote + pending project fields for deposit auto-create).
-- Project stages: execution-only (remove pre-sale stages from projects.stage).

-- -----------------------------------------------------------------------------
-- clients: funnel columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS quote_amount decimal(10,2),
  ADD COLUMN IF NOT EXISTS pending_property_address text,
  ADD COLUMN IF NOT EXISTS pending_service_type text
    CHECK (pending_service_type IS NULL OR pending_service_type IN (
      'estate_cleanout', 'presale_clearout', 'tenant_moveout', 'downsizing'
    )),
  ADD COLUMN IF NOT EXISTS quo_contact_id text;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_status_check
  CHECK (status IN (
    'inquiry',
    'walkthrough_booked',
    'booked',
    'appointment_maybe',
    'quoted',
    'deposit_received',
    'active'
  ));

COMMENT ON COLUMN public.clients.status IS 'Sales / relationship funnel; active = has work in flight after deposit.';
COMMENT ON COLUMN public.clients.pending_property_address IS 'When set with pending_service_type, transition to deposit_received can auto-create a project.';
COMMENT ON COLUMN public.clients.quo_contact_id IS 'Optional Quo/OpenPhone contact id for webhook matching.';

-- Clients who already have a non-closed project: treat as active funnel position.
UPDATE public.clients c
SET status = 'active'
WHERE EXISTS (
  SELECT 1
  FROM public.projects p
  WHERE p.client_id = c.id
    AND p.archived_at IS NULL
    AND p.stage <> 'closed'
);

-- -----------------------------------------------------------------------------
-- projects: narrow stage to execution pipeline only
-- -----------------------------------------------------------------------------
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_stage_check;

UPDATE public.projects
SET stage = 'scheduled'
WHERE stage IN ('inquiry', 'walkthrough_booked', 'quoted', 'deposit_received');

ALTER TABLE public.projects
  ALTER COLUMN stage SET DEFAULT 'scheduled';

ALTER TABLE public.projects
  ADD CONSTRAINT projects_stage_check
  CHECK (stage IN (
    'scheduled',
    'in_progress',
    'cleared',
    'report_sent',
    'review_requested',
    'closed'
  ));

-- Phone lookup for Quo webhook (service_role only).
CREATE OR REPLACE FUNCTION public.find_client_by_phone_digits(p_digits text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.clients c
  WHERE c.archived_at IS NULL
    AND length(regexp_replace(coalesce(p_digits, ''), '\D', '', 'g')) >= 10
    AND regexp_replace(coalesce(c.phone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(p_digits, ''), '\D', '', 'g')
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_client_by_phone_digits(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_client_by_phone_digits(text) TO service_role;
