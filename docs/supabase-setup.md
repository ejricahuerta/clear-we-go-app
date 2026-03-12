# Supabase setup  - Clear We Go (Phase 1)

Use this after creating your Supabase project. Both **admin.clearwego.ca** (admin) and **crew.clearwego.ca** (crew) use the same project.

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note: **Project URL**, **anon (public) key**, and **service_role key** (Settings → API).

## 2. Run migrations

Apply migrations in order (oldest first):

- **Option A  - Supabase Dashboard**  
  SQL Editor → New query → paste each migration file from `supabase/migrations/` in order (20240312000000 → 20240312000001 → 20240312000002 → 20240312000003) → Run.

- **Option B  - Supabase CLI**  
  From repo root:
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db push
  ```

## 3. Auth settings (Dashboard → Authentication → Providers)

- **Email**: Enable “Email”. Confirm email can be off for dev; enable for production if you want.
- **Google** (admin app only): Enable “Google”, add Google OAuth client ID and secret from Google Cloud Console. In Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client → **Authorized redirect URIs**, add:
  - **Supabase callback (required):** `https://oszrzqmopxfssjhnwipc.supabase.co/auth/v1/callback`  
  After Google signs the user in, Supabase receives the callback at that URL, then redirects the user to your admin app at `{origin}/auth/callback` (e.g. `http://localhost:3000/auth/callback` in dev).
- **Password**: Min 8 chars; Supabase uses secure hashing. For “one number + one special character” enforce in the app (e.g. sign-up form validation).

## 4. First owner

1. Sign in to the **admin app** with Google (or email) once.
2. In Supabase SQL Editor (as service role or with sufficient rights), set that user as owner:
   ```sql
   UPDATE public.users
   SET role = 'owner'
   WHERE auth_user_id = 'THE_AUTH_UID_HERE';
   ```
   To get `THE_AUTH_UID_HERE`: Authentication → Users → open the user → copy “User UID”.

## 5. Environment variables (both apps)

In each app (admin and crew), set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Use the **service role key** only on the server (API routes, invite flow, audit log, etc.). Never expose it to the client.

## 6. Storage (Phase 1 optional)

For Phase 1 you can skip storage. When you add it:

- Create a **private** bucket (e.g. `project-assets`).
- Use RLS so crew can only upload to their assigned project folder.
- Generate signed URLs (e.g. 1-hour expiry) for photos and PDFs.

## 7. Invite flow (app logic)

- **Send invite**: Owner creates a row in `public.users` (name, email, role, status = `pending`) and a row in `public.invites` (token hash, expiry, etc.), then sends the email with the setup link.
- **Accept invite**: Crew opens `crew.clearwego.ca/setup?token=...`, app validates token and shows password form; on submit, call `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })`. The trigger `handle_new_auth_user` will either link the existing `public.users` row (by email) or create a new one; mark the invite accepted in the app.

## 8. Invite emails (Resend)

- **Admin app** `.env.local`: set `RESEND_API_KEY` and `RESEND_FROM="Clear We Go <noreply@clearwego.ca>"` so invites come from your domain.
- **Domain verification**: In [Resend → Domains](https://resend.com/domains), add **clearwego.ca** and add the SPF + DKIM TXT records they show (e.g. in Cloudflare DNS). Verify until the domain shows as verified.
- **Spam**: If invite emails land in spam, confirm the domain is verified in Resend and that you’re sending from `noreply@clearwego.ca`. Mark a test invite as “Not spam” in Gmail/Outlook to help reputation. New domains often need a few days of sending before inbox placement improves.

## Reference

- Schema: `docs/02-database-schema.md`
- Security and RLS: `docs/03-security-and-auth.md`
- Tech stack: `docs/01-tech-stack.md`
