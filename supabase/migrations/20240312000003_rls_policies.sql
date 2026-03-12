-- Clear We Go  - Row Level Security (docs/03-security-and-auth.md)
-- Enable RLS on all tables and add role-based policies.
-- Uses current_user_id() which resolves via auth_user_id = auth.uid().

-- Role helper for policies
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid()
$$;

-- Assigned project ids for crew (used in several policies)
CREATE OR REPLACE FUNCTION public.crew_assigned_project_ids()
RETURNS setof uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM public.crew_assignments WHERE user_id = public.current_user_id()
$$;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_unavailable_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unexpected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS
-- Owner: full read/write. Admin: read all. Crew: read/write own only (phone update)
-- =============================================================================
CREATE POLICY "users_owner_all" ON public.users FOR ALL
  USING (public.current_user_role() = 'owner')
  WITH CHECK (public.current_user_role() = 'owner');
CREATE POLICY "users_admin_read" ON public.users FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "users_crew_own" ON public.users FOR SELECT USING (id = public.current_user_id());
CREATE POLICY "users_crew_update_own" ON public.users FOR UPDATE USING (id = public.current_user_id());

-- =============================================================================
-- INVITES (owner only: only owner invites)
-- =============================================================================
CREATE POLICY "invites_owner_all" ON public.invites FOR ALL
  USING (public.current_user_role() = 'owner')
  WITH CHECK (public.current_user_role() = 'owner');

-- =============================================================================
-- CONTACTS (owner + admin full; crew no access)
-- =============================================================================
CREATE POLICY "contacts_owner_admin" ON public.contacts FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- CLIENTS (owner + admin full; crew no access)
-- =============================================================================
CREATE POLICY "clients_owner_admin" ON public.clients FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- TIMELINE_EVENTS (owner + admin read + insert; crew no access; no update/delete by trigger)
-- =============================================================================
CREATE POLICY "timeline_events_owner_admin_select" ON public.timeline_events FOR SELECT USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "timeline_events_owner_admin_insert" ON public.timeline_events FOR INSERT WITH CHECK (public.current_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- PROJECTS (owner + admin full; crew read assigned only)
-- =============================================================================
CREATE POLICY "projects_owner_admin" ON public.projects FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "projects_crew_read_assigned" ON public.projects FOR SELECT USING (id IN (SELECT public.crew_assigned_project_ids()));

-- =============================================================================
-- PROJECT_DETAILS (owner + admin full; crew read assigned only)
-- =============================================================================
CREATE POLICY "project_details_owner_admin" ON public.project_details FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "project_details_crew_read" ON public.project_details FOR SELECT USING (project_id IN (SELECT public.crew_assigned_project_ids()));

-- =============================================================================
-- PROJECT_ACCESS (owner + admin full; crew read assigned only)
-- =============================================================================
CREATE POLICY "project_access_owner_admin" ON public.project_access FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "project_access_crew_read" ON public.project_access FOR SELECT USING (project_id IN (SELECT public.crew_assigned_project_ids()));

-- =============================================================================
-- PROJECT_PHOTOS (owner + admin full; crew read assigned, insert only)
-- =============================================================================
CREATE POLICY "project_photos_owner_admin" ON public.project_photos FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "project_photos_crew_select" ON public.project_photos FOR SELECT USING (project_id IN (SELECT public.crew_assigned_project_ids()));
CREATE POLICY "project_photos_crew_insert" ON public.project_photos FOR INSERT WITH CHECK (project_id IN (SELECT public.crew_assigned_project_ids()));

-- =============================================================================
-- UNEXPECTED_ITEMS (owner + admin full; crew insert on assigned, read own only)
-- =============================================================================
CREATE POLICY "unexpected_items_owner_admin" ON public.unexpected_items FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "unexpected_items_crew_insert" ON public.unexpected_items FOR INSERT WITH CHECK (project_id IN (SELECT public.crew_assigned_project_ids()));
CREATE POLICY "unexpected_items_crew_select_own" ON public.unexpected_items FOR SELECT USING (flagged_by = public.current_user_id());

-- =============================================================================
-- CHECKLIST_ITEMS (owner + admin full; crew read + update on assigned only)
-- =============================================================================
CREATE POLICY "checklist_items_owner_admin" ON public.checklist_items FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "checklist_items_crew_select" ON public.checklist_items FOR SELECT USING (project_id IN (SELECT public.crew_assigned_project_ids()));
CREATE POLICY "checklist_items_crew_update" ON public.checklist_items FOR UPDATE USING (project_id IN (SELECT public.crew_assigned_project_ids()));

-- =============================================================================
-- INVOICES / RECEIPTS / FINANCES (owner only)
-- =============================================================================
CREATE POLICY "invoices_owner" ON public.invoices FOR ALL USING (public.current_user_role() = 'owner');
CREATE POLICY "receipts_owner" ON public.receipts FOR ALL USING (public.current_user_role() = 'owner');
CREATE POLICY "finances_owner" ON public.finances FOR ALL USING (public.current_user_role() = 'owner');

-- =============================================================================
-- CREW_AVAILABILITY (owner + admin read; crew read/write own only)
-- =============================================================================
CREATE POLICY "crew_availability_owner_admin_read" ON public.crew_availability FOR SELECT USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "crew_availability_crew_own" ON public.crew_availability FOR ALL USING (user_id = public.current_user_id());

-- =============================================================================
-- CREW_UNAVAILABLE_DATES (owner + admin read; crew read/write own only)
-- =============================================================================
CREATE POLICY "crew_unavailable_dates_owner_admin_read" ON public.crew_unavailable_dates FOR SELECT USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "crew_unavailable_dates_crew_own" ON public.crew_unavailable_dates FOR ALL USING (user_id = public.current_user_id());

-- =============================================================================
-- CREW_ASSIGNMENTS (owner + admin full; crew read own only)
-- =============================================================================
CREATE POLICY "crew_assignments_owner_admin" ON public.crew_assignments FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "crew_assignments_crew_read_own" ON public.crew_assignments FOR SELECT USING (user_id = public.current_user_id());

-- =============================================================================
-- SMS_LOG (owner read only)
-- =============================================================================
CREATE POLICY "sms_log_owner_read" ON public.sms_log FOR SELECT USING (public.current_user_role() = 'owner');

-- =============================================================================
-- AUDIT_LOG (owner read only; insert via service role / backend only)
-- =============================================================================
CREATE POLICY "audit_log_owner_read" ON public.audit_log FOR SELECT USING (public.current_user_role() = 'owner');
-- No INSERT policy for authenticated users; app uses service role or edge function to insert.

-- =============================================================================
-- SETTINGS (owner full; admin read non-sensitive only  - simplified to read all for Phase 1)
-- =============================================================================
CREATE POLICY "settings_owner" ON public.settings FOR ALL USING (public.current_user_role() = 'owner');
CREATE POLICY "settings_admin_read" ON public.settings FOR SELECT USING (public.current_user_role() = 'admin');

-- =============================================================================
-- VENDORS (owner + admin; spec implies admin can manage vendors)
-- =============================================================================
CREATE POLICY "vendors_owner_admin" ON public.vendors FOR ALL USING (public.current_user_role() IN ('owner', 'admin'));
