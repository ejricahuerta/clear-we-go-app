# Supabase  - Clear We Go

One Supabase project for both **admin** (admin.clearwego.ca) and **crew** (crew.clearwego.ca) apps.

## Migrations

- `20240312000000_initial_schema.sql`  - Tables from docs/02-database-schema.md
- `20240312000001_auth_trigger_and_helpers.sql`  - Link auth.users to public.users; `current_user_id()` helper
- `20240312000002_timeline_and_audit_protection.sql`  - Append-only timeline_events; audit_log no-delete
- `20240312000003_rls_policies.sql`  - RLS on all tables per docs/03-security-and-auth.md

## Seed

- `seed.sql`  - Default admin users (clearwego@gmail.com = owner, admin@clearwego.ca = admin) and settings keys.

**How to run:** The Supabase CLI has no `db seed` for remote projects. Run the seed manually:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Click **New query**, paste the full contents of `supabase/seed.sql`, then **Run**.

## When `db push` fails with “relation already exists”

Your **remote database already has the tables**, but **`supabase_migrations.schema_migrations`** does not list the local migration files (e.g. project created in the dashboard, or history was never synced). The CLI then tries to apply `20240312000000_initial_schema.sql` again and Postgres errors on `CREATE TABLE`.

**Fix:** mark each migration that is **already reflected** in the remote database as applied, then push again so only **new** migrations run.

From the repo root (linked project: `npx supabase link`).

**PowerShell (one line):**

```powershell
npx supabase migration repair --status applied 20240312000000 20240312000001 20240312000002 20240312000003 20240313000000 20240314000000 20240315000000 20240316000000 20240317000000 20240318000000 20260409000000 20260410120000 20260411100000
```

**bash:**

```bash
npx supabase migration repair --status applied \
  20240312000000 20240312000001 20240312000002 20240312000003 \
  20240313000000 20240314000000 20240315000000 20240316000000 20240317000000 20240318000000 \
  20260409000000 20260410120000 20260411100000
```

Adjust the list: **only** repair versions whose SQL has **already** been applied on the remote. If you are unsure, inspect the remote in the SQL Editor (`information_schema.tables`, column checks, etc.) or ask the team what was run. After repair, run:

```bash
npx supabase db push
```

If `db pull` warns that history does not match local files, use `migration repair` as above so local filenames align with what the remote believes is applied.

## Setup

See **docs/supabase-setup.md** for:

- Creating the project and running migrations
- Enabling Email and Google auth
- Setting the first owner
- Env vars for both apps
