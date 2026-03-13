# Clear We Go  - Task List

Based on **docs/15-build-order.md**. Update checkboxes as you complete work.

---

## Phase 1  - Foundation

*Goal: Both apps load, auth works, basic navigation in place.*

- [x] **1. Create Supabase project**  
  Project created; linked via `.env.local` (from `keys.json`).

- [x] **2. Run full database schema** (02-database-schema.md)  
  Migrations in `supabase/migrations/20240312000000_initial_schema.sql`.  
  Run: `npx supabase db push` (after `npx supabase link`).

- [x] **3. Set up RLS policies** (03-security-and-auth.md)  
  In `supabase/migrations/20240312000003_rls_policies.sql`.  
  Auth trigger + `current_user_id()` in `20240312000001_auth_trigger_and_helpers.sql`.  
  Timeline/audit protections in `20240312000002_timeline_and_audit_protection.sql`.

- [x] **4. Create clearwego-admin Next.js project**  
  Next.js 14, App Router, Tailwind, shadcn/ui (01-tech-stack.md). Supabase client + SSR in `lib/supabase`. `.env.local` in app dir.

- [x] **5. Create clearwego-crew Next.js project**  
  Same stack; mobile-first. Supabase client + SSR, shadcn/ui, `.env.local` in app dir.

- [x] **6. Configure auth on both apps**  
  Supabase Auth: admin has login (email/password + Google OAuth), crew has email/password only.  
  Session in cookies; `/api/auth/login` and `/auth/callback` (OAuth). NextAuth can be layered later if needed.

- [x] **7. Role-based middleware on both apps**  
  Admin: only owner and admin; crew: only crew. Redirect to `/login?error=wrong-app` if wrong role.

- [x] **8. Invite system (admin → crew)**  
  Owner: Team page `/team` + `POST /api/team/invite` (creates pending user + invite, sends email via Resend).  
  Crew: `/setup?token=...` validates token, password form, signUp + `POST /api/invite/accept`. Set `RESEND_API_KEY` and optionally `CREW_APP_URL`, `RESEND_FROM` in admin.

- [x] **9. Basic sidebar layout on admin app**  
  Desktop-first sidebar with Home, Team, Sign out; `(dashboard)` layout wraps `/` and `/team`.

- [x] **10. Basic bottom nav layout on crew app**  
  Mobile-first bottom nav: Today (/), Availability (/availability), Sign out. `(dashboard)` layout; content has pb-14 so it’s not hidden behind the nav.

- [x] **11. PWA manifest.json on both apps**  
  Add to home screen; service worker.

- [x] **12. Deploy both apps to Vercel**  
  admin.clearwego.ca, crew.clearwego.ca. See **docs/deploy-vercel-github.md** (GitHub → Vercel CI/CD, two projects, monorepo roots).

**Phase 1 done when:** Owner logs in with Google (admin). Admin logs in with email/password. Owner invites crew. Crew accepts invite and logs in to crew app.

---

## Phase 2  - Core Admin

*Goal: Owner can manage contacts, clients, and projects.*

- [x] **13. Contacts module**  - list, filters, CSV import, profile, outreach, convert to client, analytics.
- [x] **14. Client profiles**  - list, profile page, timeline (append-only), `logTimelineEvent`.
- [x] **15. Projects CRUD**  - Kanban, list, detail (tabs), service fields, stage change, key/access.
- [x] **16. Service-specific checklists**  - auto-create on project, by service type.
- [x] **17. Crew assignment with availability**  - display availability, assign crew, notification.

**Ref:** docs/04-contacts-module.md, 05-clients-and-timeline.md, 06-projects-module.md, 08-availability-system.md.

---

## Phase 3  - Crew App

*Goal: Crew can complete a full job from their phone.*

- [ ] **18. Today's jobs view**  - assigned projects for today, Start Job.
- [ ] **19. Job detail**  - checklist, access details.
- [ ] **20. Photo upload**  - camera, before/after, Supabase Storage, offline sync.
- [ ] **21. Flag unexpected item**  - photo + description, push to owner.
- [ ] **22. Mark as cleared**  - checklist check, confirm, update stage, notify owner.
- [ ] **23. Availability management**  - weekly schedule, unavailable dates.
- [ ] **24. Offline support**  - cache jobs, local storage, sync on reconnect.
- [ ] **25. Push notifications (crew app).**

**Ref:** docs/07-crew-app.md, 08-availability-system.md.

---

## Phase 4  - Documents and Payments

- [ ] **26–32.** Quote, invoice, receipt, completion report PDFs; payment received flow; overdue handling; Stripe (disabled by default).  
**Ref:** docs/09-documents-and-pdf.md, 11-payment-system.md.

---

## Phase 5  - Communications

- [ ] **33–36.** Twilio SMS (all triggers), Resend email, scheduled messages, SMS toggles.  
**Ref:** docs/10-communications-sms-email.md.

---

## Phase 6  - Operations

- [ ] **37–42.** Finances (owner), team management, vendors, notifications centre, push (admin), Settings.  
**Ref:** docs/11, 12, 13.

---

## Phase 7  - Polish

- [ ] **43–50.** Mobile optimisation, error/loading states, security headers, audit log viewer, Lighthouse, PWA tuning, QA.  
**Ref:** docs/14-ui-ux.md.

---

## Already in place (from setup)

| Item | Location |
|------|----------|
| Supabase env | `.env.local` (from keys.json) |
| Schema migrations | `supabase/migrations/20240312000000_initial_schema.sql` |
| Auth trigger + helpers | `supabase/migrations/20240312000001_auth_trigger_and_helpers.sql` |
| Timeline/audit protection | `supabase/migrations/20240312000002_timeline_and_audit_protection.sql` |
| RLS policies | `supabase/migrations/20240312000003_rls_policies.sql` |
| Default settings seed | `supabase/seed.sql` |
| Setup instructions | `docs/supabase-setup.md` |
| Env template | `.env.example` |
| Gitignore | `.gitignore` (env, keys.json) |
