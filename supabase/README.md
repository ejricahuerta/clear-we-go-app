# Supabase — Clear We Go

One Supabase project for both **admin** (app.clearwego.ca) and **crew** (crew.clearwego.ca) apps.

## Migrations

- `20240312000000_initial_schema.sql` — Tables from docs/02-database-schema.md
- `20240312000001_auth_trigger_and_helpers.sql` — Link auth.users to public.users; `current_user_id()` helper
- `20240312000002_timeline_and_audit_protection.sql` — Append-only timeline_events; audit_log no-delete
- `20240312000003_rls_policies.sql` — RLS on all tables per docs/03-security-and-auth.md

## Seed

- `seed.sql` — Default admin users (clearwego@gmail.com = owner, admin@clearwego.ca = admin) and settings keys.

**How to run:** The Supabase CLI has no `db seed` for remote projects. Run the seed manually:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Click **New query**, paste the full contents of `supabase/seed.sql`, then **Run**.

## Setup

See **docs/supabase-setup.md** for:

- Creating the project and running migrations
- Enabling Email and Google auth
- Setting the first owner
- Env vars for both apps
