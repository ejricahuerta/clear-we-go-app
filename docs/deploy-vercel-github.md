# Deploy to Vercel via GitHub (CI/CD)

This repo is a **monorepo**: two Next.js apps in one repository. You deploy **two separate Vercel projects**, each with its own root directory and env vars.

## 1. Push the repo to GitHub

From the repo root (no need to commit `.env.local` or `keys.json`  - they are in `.gitignore`):

```bash
git init
git add .
git commit -m "Phase 1: auth, invite, PWA manifest"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/clear-we-go-app.git
git push -u origin main
```

Use your actual GitHub org/repo URL. After this, Vercel will deploy from `main` (or your production branch) on every push.

## 2. Create two Vercel projects

In [Vercel](https://vercel.com): **Add New Project** → **Import Git Repository** → select your repo.

### Project 1  - Admin app (admin.clearwego.ca)

- **Project Name:** e.g. `clearwego-admin`
- **Root Directory:** Click **Edit** and set to **`clearwego-admin`** (not the repo root).
- **Framework Preset:** Next.js (auto-detected).
- **Build Command / Output:** leave default.
- **Environment Variables:** Add these (Settings → Environment Variables). Use **Production**, and optionally **Preview** for PR deploys.

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Same for both apps |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same for both apps |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Same for both apps |
| `RESEND_API_KEY` | Resend API key | For invite emails |
| `RESEND_FROM` | (optional) e.g. `Clear We Go <noreply@clearwego.ca>` | Defaults to Resend onboarding |
| `CREW_APP_URL` | `https://crew.clearwego.ca` | Base URL for invite links (must match crew app domain) |

For **Google OAuth** (admin only):

| Name | Value |
|------|--------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

In **Google Cloud Console** → your OAuth client → **Authorized redirect URIs**, add:

- `https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback` (Supabase callback)
- Your admin app URL is not needed in Google; Supabase redirects to your app’s `/auth/callback` using the request origin.

After the first deploy, add your **custom domain**: **Settings → Domains** → add **admin.clearwego.ca** and follow DNS instructions (usually a CNAME to `cname.vercel-dns.com` or similar).

---

### Project 2  - Crew app (crew.clearwego.ca)

- **Project Name:** e.g. `clearwego-crew`
- **Root Directory:** **`clearwego-crew`**
- **Framework Preset:** Next.js
- **Environment Variables:**

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as admin | Same Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as admin | Same Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as admin | Required for invite validate/accept |

No Resend or Google vars needed for crew. Add **Custom Domain**: **crew.clearwego.ca**.

## 3. CI/CD behavior

- **Push to `main`** (or your production branch) → Vercel builds and deploys both projects.
- Each project builds only its root (`clearwego-admin` or `clearwego-crew`); Vercel runs `npm install` and `npm run build` in that directory.
- Preview deployments are created for pull requests if you enable them.

## 4. Checklist after deploy

- [ ] Admin: open `https://admin.clearwego.ca` (or your Vercel URL), log in with Google or email.
- [ ] Crew: open `https://crew.clearwego.ca`, log in with a crew account.
- [ ] From admin, send an invite; open the invite link (should point to `https://crew.clearwego.ca/setup?token=...`). Complete setup and sign in on crew.
- [ ] In Supabase Dashboard → Authentication → URL Configuration: set **Site URL** to your production admin URL (e.g. `https://admin.clearwego.ca`) if you use redirects; add **Redirect URLs** for `https://admin.clearwego.ca/**` and `https://crew.clearwego.ca/**` if required.

## 5. Env templates

Per-app `.env.example` files are in `clearwego-admin/` and `clearwego-crew/` for reference; copy to `.env.local` for local dev. For Vercel, set the variables in the dashboard (or via Vercel CLI) as above.
