-- Soft-archive clients (active list hides rows where archived_at is set).

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_clients_active_list
  ON public.clients (created_at DESC)
  WHERE archived_at IS NULL;
