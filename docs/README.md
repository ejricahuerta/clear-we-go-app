# Clear We Go — Cursor Build Spec

## Business Context
Clear We Go is a Toronto-based estate and property cleanout business.
Business phone: (581) 998-5673
Website: clearwego.ca
Service area: Toronto, North York, Markham, Vaughan, Newmarket, Richmond Hill

## Task List to Follow
**Use [TASK-LIST.md](TASK-LIST.md)** for the current checklist. It mirrors the build order with checkboxes and marks what’s already done (e.g. Supabase schema, RLS, auth). Work through Phase 1, then Phase 2, and so on.

## How to Use These Docs
Reference the relevant .md file for each phase of the build.
Always read this README first, then the task list and the specific file for your task.

## How to Prompt Cursor Each Session
```
This is the Clear We Go internal ops platform.
All specs are in the /docs folder.
Read docs/README.md for context.
Today we are building [specific feature].
Refer to docs/[relevant file] for the spec.
```

## Files

| File | Contents |
|------|----------|
| 00-overview.md | Business context and two-app structure |
| 01-tech-stack.md | Stack decisions and services |
| 02-database-schema.md | Full Supabase schema |
| 03-security-and-auth.md | Auth, RLS, invite system |
| 04-contacts-module.md | Outreach contacts CRM |
| 05-clients-and-timeline.md | Client profiles and timeline |
| 06-projects-module.md | Project management and checklists |
| 07-crew-app.md | Crew PWA spec |
| 08-availability-system.md | Crew scheduling and availability |
| 09-documents-and-pdf.md | Quote, invoice, receipt, completion report |
| 10-communications-sms-email.md | Twilio SMS and Resend email |
| 11-payment-system.md | E-transfer, invoicing, Stripe (phase 2) |
| 12-admin-app-pages.md | Admin UI pages and flows |
| 13-notifications.md | Push notifications and alerts |
| 14-ui-ux.md | Design system and UX rules |
| 15-build-order.md | Phased build plan |
| **TASK-LIST.md** | **Checklist to follow (phases + progress)** |
| supabase-setup.md | Supabase project, migrations, auth setup |

## Build Order
Follow **TASK-LIST.md** (and 15-build-order.md for full phase descriptions). Do not skip phases. Complete each phase before starting the next.
