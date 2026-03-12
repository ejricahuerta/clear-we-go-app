-- Default admin users. They must sign in once (admin app) to link auth; trigger will set auth_user_id and status = 'active'.
-- clearwego@gmail.com = owner (can send invites); admin@clearwego.ca = admin. Promote/demote via: UPDATE public.users SET role = 'owner' WHERE email = '...';
INSERT INTO public.users (name, email, role, status)
VALUES
  ('Clear We Go', 'clearwego@gmail.com', 'owner', 'pending'),
  ('Admin', 'admin@clearwego.ca', 'admin', 'pending')
ON CONFLICT (email) DO NOTHING;

-- Default settings keys (docs/02-database-schema.md). Values can be set in app or Settings.
INSERT INTO public.settings (key, value) VALUES
  ('business_name', 'Clear We Go'),
  ('business_phone', '(581) 998-5673'),
  ('business_email', 'noreply@clearwego.ca'),
  ('business_address', NULL),
  ('logo_url', NULL),
  ('hst_registered', 'false'),
  ('hst_number', NULL),
  ('default_deposit_percent', '50'),
  ('default_payment_terms', '7'),
  ('etransfer_email', NULL),
  ('last_invoice_number', '0'),
  ('last_receipt_number', '0'),
  ('stripe_enabled', 'false'),
  ('stripe_publishable_key', NULL),
  ('stripe_secret_key', NULL),
  ('stripe_webhook_secret', NULL),
  ('twilio_enabled', 'false'),
  ('google_review_link', NULL),
  ('invoice_footer_message', NULL),
  ('sms_quote_sent_enabled', 'true'),
  ('sms_job_scheduled_enabled', 'true'),
  ('sms_job_reminder_client_enabled', 'true'),
  ('sms_job_started_enabled', 'true'),
  ('sms_unexpected_item_enabled', 'true'),
  ('sms_job_cleared_enabled', 'true'),
  ('sms_invoice_sent_enabled', 'true'),
  ('sms_review_request_enabled', 'true'),
  ('sms_crew_assignment_enabled', 'true'),
  ('sms_crew_reminder_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
