# 02  - Database Schema

All tables live in one Supabase project.
RLS is enabled on every table.
See 03-security-and-auth.md for RLS policies.

---

## users
```sql
id              uuid primary key default gen_random_uuid()
name            text not null
email           text unique not null
role            text not null check (role in ('owner','admin','crew'))
phone           text
availability_notes text
status          text default 'active' check (status in ('active','pending','inactive'))
created_at      timestamptz default now()
```

## invites
```sql
id              uuid primary key default gen_random_uuid()
email           text not null
name            text not null
role            text not null
token           text not null unique  -- SHA-256 hashed
expires_at      timestamptz not null  -- 48 hours from creation
accepted        boolean default false
accepted_at     timestamptz
created_by      uuid references users(id)
created_at      timestamptz default now()
```

## crew_availability
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references users(id) on delete cascade
day_of_week     text check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday'))
available       boolean default true
start_time      time
end_time        time
updated_at      timestamptz default now()
```

## crew_unavailable_dates
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references users(id) on delete cascade
date            date not null
reason          text check (reason in ('sick','personal','other'))
created_at      timestamptz default now()
```

## crew_assignments
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
user_id         uuid references users(id)
assigned_by     uuid references users(id)
job_date        date not null
start_time      time
created_at      timestamptz default now()
```

## contacts
```sql
id              uuid primary key default gen_random_uuid()
first_name      text not null
last_name       text not null
company         text
type            text check (type in ('estate_lawyer','realtor','property_manager','other'))
email           text
phone           text
neighbourhood   text
found_via       text check (found_via in ('apollo','linkedin','realtor_ca','lsoo','referral','other'))
status          text default 'new' check (status in ('new','contacted','responded','converted','dead'))
email_1_sent    boolean default false
email_1_date    timestamptz
email_2_sent    boolean default false
email_2_date    timestamptz
email_3_sent    boolean default false
email_3_date    timestamptz
response_received boolean default false
response_date   timestamptz
response_notes  text
last_contacted_date timestamptz
follow_up_date  date
converted_to_client boolean default false
client_id       uuid references clients(id)
notes           text
created_at      timestamptz default now()
```

## clients
```sql
id              uuid primary key default gen_random_uuid()
first_name      text not null
last_name       text not null
email           text
phone           text
address         text
neighbourhood   text
client_type     text check (client_type in ('executor','estate_lawyer','realtor','property_manager','family','other'))
referral_source text
contact_id      uuid references contacts(id)
sms_opted_out   boolean default false
google_review_received boolean default false
notes           text
created_at      timestamptz default now()
```

## timeline_events
-- APPEND ONLY. No updates or deletes ever.
```sql
id              uuid primary key default gen_random_uuid()
client_id       uuid references clients(id) on delete cascade
project_id      uuid references projects(id)  -- nullable
event_type      text not null
event_category  text not null check (event_category in ('contact','client','project','crew','communication','document','finance','review','system'))
event_description text not null
created_by_id   uuid references users(id)  -- null if system
created_by_name text not null  -- stored at time of event
created_by_role text not null  -- owner, admin, crew, system
details         jsonb default '{}'
photo_urls      text[] default '{}'
created_at      timestamptz default now()
```

## projects
```sql
id              uuid primary key default gen_random_uuid()
client_id       uuid references clients(id) on delete cascade
service_type    text not null check (service_type in ('estate_cleanout','presale_clearout','tenant_moveout','downsizing'))
property_size   text check (property_size in ('basement','half_house','full_house','full_estate'))
property_address text not null
neighbourhood   text
stage           text default 'inquiry' check (stage in ('inquiry','walkthrough_booked','quoted','deposit_received','scheduled','in_progress','cleared','report_sent','review_requested','closed'))
walkthrough_date timestamptz
walkthrough_method text check (walkthrough_method in ('video','in_person'))
job_date        date
start_time      time
quote_amount    decimal(10,2)
deposit_received boolean default false
deposit_amount  decimal(10,2)
invoice_amount  decimal(10,2)
payment_received boolean default false
bin_vendor      text
bin_cost        decimal(10,2)
rooms_cleared   integer
unexpected_items_found boolean default false
client_notified_of_unexpected boolean default false
before_photos_uploaded boolean default false
after_photos_uploaded boolean default false
completion_report_sent boolean default false
report_sent_date timestamptz
review_requested boolean default false
review_received boolean default false
notes           text
created_at      timestamptz default now()
```

## project_details
-- Service-specific fields stored as key/value
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
field_key       text not null
field_value     text
created_at      timestamptz default now()
unique(project_id, field_key)
```

### Estate Cleanout Fields
- executor_name
- estate_lawyer_name
- authorization_document_received
- preapproved_items_list_provided
- items_flagged_for_keep
- items_donated
- items_disposed

### Pre-Sale Clearout Fields
- listing_agent_name
- listing_date
- photo_shoot_date
- property_photo_ready_confirmed
- staging_required

### Tenant Move-Out Fields
- property_manager_name
- number_of_units
- volume_pricing_applied
- tenant_vacate_date
- inventory_report_sent
- property_damage_noted

### Downsizing Fields
- moving_to (assisted_living, smaller_home, family_home)
- family_members_involved
- sensitive_items_flagged
- items_moved_to_new_location
- items_donated
- items_disposed

## project_access
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
access_type     text check (access_type in ('key','lockbox','owner_present','realtor_lockbox','building_fob'))
received_from   text
received_date   timestamptz
lockbox_code    text  -- encrypted at application level
building_instructions text
parking_instructions text
key_returned_to text
key_returned_date timestamptz
created_at      timestamptz default now()
```

## project_photos
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
uploaded_by     uuid references users(id)
photo_type      text check (photo_type in ('before','after'))
room_name       text not null
storage_url     text not null
created_at      timestamptz default now()
```

## unexpected_items
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
flagged_by      uuid references users(id)
item_description text not null
photo_url       text
decision        text default 'pending' check (decision in ('keep','remove','pending'))
decided_by      uuid references users(id)
decided_at      timestamptz
created_at      timestamptz default now()
```

## checklist_items
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade
service_type    text not null
item_text       text not null
completed       boolean default false
completed_by    uuid references users(id)
completed_at    timestamptz
sort_order      integer not null
created_at      timestamptz default now()
```

## invoices
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id)
client_id       uuid references clients(id)
invoice_number  text unique not null  -- CWG-0001
invoice_type    text check (invoice_type in ('deposit','final','full'))
amount          decimal(10,2) not null
hst_amount      decimal(10,2) default 0
total_amount    decimal(10,2) not null
due_date        date
status          text default 'draft' check (status in ('draft','sent','viewed','paid','overdue'))
payment_method  text check (payment_method in ('etransfer','cash','cheque','credit_card'))
payment_date    timestamptz
payment_reference text
stripe_payment_intent_id text
pdf_url         text
sent_at         timestamptz
viewed_at       timestamptz
paid_at         timestamptz
overdue_notified_day_3  boolean default false
overdue_notified_day_7  boolean default false
overdue_notified_day_14 boolean default false
created_by      uuid references users(id)
created_at      timestamptz default now()
```

## receipts
```sql
id              uuid primary key default gen_random_uuid()
invoice_id      uuid references invoices(id)
project_id      uuid references projects(id)
client_id       uuid references clients(id)
receipt_number  text unique not null  -- CWG-R-0001
amount_paid     decimal(10,2) not null
payment_method  text
payment_date    timestamptz
payment_reference text
pdf_url         text
sent_at         timestamptz
created_at      timestamptz default now()
```

## finances
```sql
id              uuid primary key default gen_random_uuid()
project_id      uuid references projects(id) on delete cascade unique
revenue         decimal(10,2) default 0
deposit_amount  decimal(10,2) default 0
final_payment_amount decimal(10,2) default 0
bin_cost        decimal(10,2) default 0
crew_cost       decimal(10,2) default 0
disposal_fees   decimal(10,2) default 0
fuel_cost       decimal(10,2) default 0
supplies_cost   decimal(10,2) default 0
subcontractor_cost decimal(10,2) default 0
other_expenses  decimal(10,2) default 0
total_expenses  decimal(10,2) generated always as (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses) stored
gross_profit    decimal(10,2) generated always as (revenue - (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses)) stored
margin_percent  decimal(5,2) generated always as (case when revenue > 0 then ((revenue - (bin_cost + crew_cost + disposal_fees + fuel_cost + supplies_cost + subcontractor_cost + other_expenses)) / revenue * 100) else 0 end) stored
created_at      timestamptz default now()
```

## vendors
```sql
id              uuid primary key default gen_random_uuid()
name            text not null
service_type    text check (service_type in ('bin_rental','disposal','donation','auction','cleaning','storage','other'))
contact_name    text
phone           text
email           text
pricing_notes   text
notes           text
created_at      timestamptz default now()
```

## sms_log
```sql
id              uuid primary key default gen_random_uuid()
client_id       uuid references clients(id)  -- nullable
user_id         uuid references users(id)    -- nullable
recipient_type  text check (recipient_type in ('client','crew'))
phone_number    text not null
message_body    text not null
twilio_message_sid text
status          text check (status in ('sent','delivered','failed'))
triggered_by    text not null  -- event type that triggered this
created_at      timestamptz default now()
```

## audit_log
-- Cannot be deleted by anyone
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references users(id)
action          text not null
resource_type   text
resource_id     uuid
ip_address      text
user_agent      text
created_at      timestamptz default now()
```

## settings
```sql
id              uuid primary key default gen_random_uuid()
key             text unique not null
value           text
updated_at      timestamptz default now()
```

### Settings Keys
```
business_name
business_phone
business_email
business_address
logo_url
hst_registered
hst_number
default_deposit_percent       -- default: 50
default_payment_terms         -- default: 7
etransfer_email
last_invoice_number           -- auto increment
last_receipt_number           -- auto increment
stripe_enabled
stripe_publishable_key
stripe_secret_key             -- encrypted
stripe_webhook_secret         -- encrypted
twilio_enabled
google_review_link
invoice_footer_message
sms_quote_sent_enabled
sms_job_scheduled_enabled
sms_job_reminder_client_enabled
sms_job_started_enabled
sms_unexpected_item_enabled
sms_job_cleared_enabled
sms_invoice_sent_enabled
sms_review_request_enabled
sms_crew_assignment_enabled
sms_crew_reminder_enabled
```

---

## Helper Function
Use this everywhere to log timeline events:

```typescript
logTimelineEvent({
  clientId: string,
  projectId?: string,
  eventType: string,
  eventDescription: string,
  details?: object,
  createdById?: string,   // null if system
  createdByName: string,
  createdByRole: string,
  photoUrls?: string[]
})
```

Call this automatically on every action.
Never rely on team members remembering to log.
