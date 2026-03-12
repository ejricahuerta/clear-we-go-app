-- Clear We Go  - Initial schema (docs/02-database-schema.md)
-- Run in order: tables, then RLS, then policies.
-- This migration: tables only. RLS enabled in next migration.

-- =============================================================================
-- USERS (id from gen_random_uuid; auth link via auth_user_id in auth migration)
-- =============================================================================
CREATE TABLE public.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text UNIQUE NOT NULL,
  role            text NOT NULL CHECK (role IN ('owner','admin','crew')),
  phone           text,
  availability_notes text,
  status          text DEFAULT 'active' CHECK (status IN ('active','pending','inactive')),
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- INVITES
-- =============================================================================
CREATE TABLE public.invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  name            text NOT NULL,
  role            text NOT NULL,
  token           text NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  accepted        boolean DEFAULT false,
  accepted_at     timestamptz,
  created_by      uuid REFERENCES public.users(id),
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- CONTACTS (client_id FK added after clients exists)
-- =============================================================================
CREATE TABLE public.contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  company         text,
  type            text CHECK (type IN ('estate_lawyer','realtor','property_manager','other')),
  email           text,
  phone           text,
  neighbourhood   text,
  found_via       text CHECK (found_via IN ('apollo','linkedin','realtor_ca','lsoo','referral','other')),
  status          text DEFAULT 'new' CHECK (status IN ('new','contacted','responded','converted','dead')),
  email_1_sent    boolean DEFAULT false,
  email_1_date    timestamptz,
  email_2_sent    boolean DEFAULT false,
  email_2_date    timestamptz,
  email_3_sent    boolean DEFAULT false,
  email_3_date    timestamptz,
  response_received boolean DEFAULT false,
  response_date   timestamptz,
  response_notes  text,
  last_contacted_date timestamptz,
  follow_up_date  date,
  converted_to_client boolean DEFAULT false,
  client_id       uuid,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- CLIENTS
-- =============================================================================
CREATE TABLE public.clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text,
  phone           text,
  address         text,
  neighbourhood   text,
  client_type     text CHECK (client_type IN ('executor','estate_lawyer','realtor','property_manager','family','other')),
  referral_source text,
  contact_id      uuid REFERENCES public.contacts(id),
  sms_opted_out   boolean DEFAULT false,
  google_review_received boolean DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.contacts
  ADD CONSTRAINT fk_contacts_client FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- =============================================================================
-- PROJECTS
-- =============================================================================
CREATE TABLE public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type    text NOT NULL CHECK (service_type IN ('estate_cleanout','presale_clearout','tenant_moveout','downsizing')),
  property_size   text CHECK (property_size IN ('basement','half_house','full_house','full_estate')),
  property_address text NOT NULL,
  neighbourhood   text,
  stage           text DEFAULT 'inquiry' CHECK (stage IN ('inquiry','walkthrough_booked','quoted','deposit_received','scheduled','in_progress','cleared','report_sent','review_requested','closed')),
  walkthrough_date timestamptz,
  walkthrough_method text CHECK (walkthrough_method IN ('video','in_person')),
  job_date        date,
  start_time      time,
  quote_amount    decimal(10,2),
  deposit_received boolean DEFAULT false,
  deposit_amount  decimal(10,2),
  invoice_amount  decimal(10,2),
  payment_received boolean DEFAULT false,
  bin_vendor      text,
  bin_cost        decimal(10,2),
  rooms_cleared   integer,
  unexpected_items_found boolean DEFAULT false,
  client_notified_of_unexpected boolean DEFAULT false,
  before_photos_uploaded boolean DEFAULT false,
  after_photos_uploaded boolean DEFAULT false,
  completion_report_sent boolean DEFAULT false,
  report_sent_date timestamptz,
  review_requested boolean DEFAULT false,
  review_received boolean DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- CREW
-- =============================================================================
CREATE TABLE public.crew_availability (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week     text NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  available       boolean DEFAULT true,
  start_time      time,
  end_time        time,
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE public.crew_unavailable_dates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            date NOT NULL,
  reason          text CHECK (reason IN ('sick','personal','other')),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.crew_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id),
  assigned_by     uuid REFERENCES public.users(id),
  job_date        date NOT NULL,
  start_time      time,
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- TIMELINE (append-only; no update/delete  - enforced by trigger)
-- =============================================================================
CREATE TABLE public.timeline_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.projects(id),
  event_type      text NOT NULL,
  event_category  text NOT NULL CHECK (event_category IN ('contact','client','project','crew','communication','document','finance','review','system')),
  event_description text NOT NULL,
  created_by_id   uuid REFERENCES public.users(id),
  created_by_name text NOT NULL,
  created_by_role text NOT NULL,
  details         jsonb DEFAULT '{}',
  photo_urls      text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- PROJECT DETAILS / ACCESS / PHOTOS / UNEXPECTED ITEMS / CHECKLIST
-- =============================================================================
CREATE TABLE public.project_details (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key       text NOT NULL,
  field_value     text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(project_id, field_key)
);

CREATE TABLE public.project_access (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_type     text CHECK (access_type IN ('key','lockbox','owner_present','realtor_lockbox','building_fob')),
  received_from   text,
  received_date   timestamptz,
  lockbox_code    text,
  building_instructions text,
  parking_instructions text,
  key_returned_to text,
  key_returned_date timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.project_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by     uuid REFERENCES public.users(id),
  photo_type      text NOT NULL CHECK (photo_type IN ('before','after')),
  room_name       text NOT NULL,
  storage_url     text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.unexpected_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  flagged_by      uuid REFERENCES public.users(id),
  item_description text NOT NULL,
  photo_url       text,
  decision        text DEFAULT 'pending' CHECK (decision IN ('keep','remove','pending')),
  decided_by      uuid REFERENCES public.users(id),
  decided_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_type    text NOT NULL,
  item_text       text NOT NULL,
  completed       boolean DEFAULT false,
  completed_by    uuid REFERENCES public.users(id),
  completed_at    timestamptz,
  sort_order      integer NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- INVOICES / RECEIPTS / FINANCES
-- =============================================================================
CREATE TABLE public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES public.projects(id),
  client_id       uuid REFERENCES public.clients(id),
  invoice_number  text UNIQUE NOT NULL,
  invoice_type    text CHECK (invoice_type IN ('deposit','final','full')),
  amount          decimal(10,2) NOT NULL,
  hst_amount      decimal(10,2) DEFAULT 0,
  total_amount    decimal(10,2) NOT NULL,
  due_date        date,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue')),
  payment_method  text CHECK (payment_method IN ('etransfer','cash','cheque','credit_card')),
  payment_date    timestamptz,
  payment_reference text,
  stripe_payment_intent_id text,
  pdf_url         text,
  sent_at         timestamptz,
  viewed_at       timestamptz,
  paid_at         timestamptz,
  overdue_notified_day_3  boolean DEFAULT false,
  overdue_notified_day_7  boolean DEFAULT false,
  overdue_notified_day_14 boolean DEFAULT false,
  created_by      uuid REFERENCES public.users(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid REFERENCES public.invoices(id),
  project_id      uuid REFERENCES public.projects(id),
  client_id       uuid REFERENCES public.clients(id),
  receipt_number  text UNIQUE NOT NULL,
  amount_paid     decimal(10,2) NOT NULL,
  payment_method  text,
  payment_date    timestamptz,
  payment_reference text,
  pdf_url         text,
  sent_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.finances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  revenue         decimal(10,2) DEFAULT 0,
  deposit_amount  decimal(10,2) DEFAULT 0,
  final_payment_amount decimal(10,2) DEFAULT 0,
  bin_cost        decimal(10,2) DEFAULT 0,
  crew_cost       decimal(10,2) DEFAULT 0,
  disposal_fees   decimal(10,2) DEFAULT 0,
  fuel_cost       decimal(10,2) DEFAULT 0,
  supplies_cost   decimal(10,2) DEFAULT 0,
  subcontractor_cost decimal(10,2) DEFAULT 0,
  other_expenses  decimal(10,2) DEFAULT 0,
  total_expenses  decimal(10,2) GENERATED ALWAYS AS (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses) STORED,
  gross_profit    decimal(10,2) GENERATED ALWAYS AS (revenue - (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses)) STORED,
  margin_percent  decimal(5,2) GENERATED ALWAYS AS (CASE WHEN revenue > 0 THEN ((revenue - (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses)) / revenue * 100) ELSE 0 END) STORED,
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- VENDORS / SMS / AUDIT / SETTINGS
-- =============================================================================
CREATE TABLE public.vendors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  service_type    text CHECK (service_type IN ('bin_rental','disposal','donation','auction','cleaning','storage','other')),
  contact_name    text,
  phone           text,
  email           text,
  pricing_notes   text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.sms_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES public.clients(id),
  user_id         uuid REFERENCES public.users(id),
  recipient_type  text CHECK (recipient_type IN ('client','crew')),
  phone_number    text NOT NULL,
  message_body    text NOT NULL,
  twilio_message_sid text,
  status          text CHECK (status IN ('sent','delivered','failed')),
  triggered_by    text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.users(id),
  action          text NOT NULL,
  resource_type   text,
  resource_id     uuid,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text UNIQUE NOT NULL,
  value           text,
  updated_at      timestamptz DEFAULT now()
);

-- Indexes for RLS and common queries
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_crew_assignments_user_id ON public.crew_assignments(user_id);
CREATE INDEX idx_crew_assignments_project_id ON public.crew_assignments(project_id);
CREATE INDEX idx_timeline_events_client_id ON public.timeline_events(client_id);
CREATE INDEX idx_timeline_events_project_id ON public.timeline_events(project_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_stage ON public.projects(stage);
CREATE INDEX idx_projects_job_date ON public.projects(job_date);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
