# 15 — Build Order

## Rules
- Complete each phase before starting the next
- Do not build phase 3 features during phase 1
- Test each phase before moving on
- Deploy to Vercel at end of each phase

---

## Phase 1 — Foundation
*Goal: Both apps load, auth works, basic navigation in place*

1. Create Supabase project
2. Run full database schema from 02-database-schema.md
3. Set up RLS policies from 03-security-and-auth.md
4. Create clearwego-admin Next.js project
5. Create clearwego-crew Next.js project
6. Configure NextAuth.js on both apps
   - Google OAuth on admin app
   - Email/password on both apps
7. Role-based middleware on both apps
   - Admin app: owner and admin only
   - Crew app: crew only
8. Invite system (admin app → crew app)
   - Send invite email via Resend
   - Setup page on crew app
9. Basic sidebar layout on admin app
10. Basic bottom nav layout on crew app
11. PWA manifest.json on both apps
12. Deploy both apps to Vercel

**Done when:** Owner can log in to admin app with Google. Admin can log in with email/password. Owner can invite crew. Crew can accept invite and log in to crew app.

---

## Phase 2 — Core Admin
*Goal: Owner can manage contacts, clients, and projects*

13. Contacts module
    - List view with filters
    - CSV import with duplicate detection
    - Contact profile page
    - Log outreach / sequence tracking
    - Convert to client
    - Simple analytics bar
14. Client profiles
    - List view
    - Client profile page
    - Timeline component (append only)
    - logTimelineEvent helper function
15. Projects CRUD
    - Kanban view
    - List view
    - Project detail page (all tabs)
    - Service specific fields
    - Stage change (triggers timeline event)
    - Key and access section
16. Service specific checklists
    - Auto-created on project creation
    - Based on service type
17. Crew assignment with availability
    - Available/unavailable display
    - Assign crew to project
    - Triggers notification

**Done when:** Owner can add contacts, convert to clients, create projects, assign crew, and see the full client timeline updating automatically.

---

## Phase 3 — Crew App
*Goal: Crew can complete a full job from their phone*

18. Today's jobs view
    - Query assigned projects for today
    - Project card with details
    - Start Job button
19. Job detail page
    - Checklist (service specific)
    - Access details section
20. Photo upload
    - Camera access
    - Before/after per room
    - Upload to Supabase Storage
    - Thumbnail confirmation
    - Offline save + sync
21. Flag unexpected item
    - Photo + description
    - Push notification to owner
    - Decision display in real time
22. Mark as cleared
    - Checklist complete check
    - Confirmation screen
    - Updates project stage
    - Notifies owner
23. Availability management
    - Weekly schedule
    - Mark dates unavailable
24. Offline support
    - Cache today's jobs on login
    - Local storage for checklist and photos
    - Auto sync on reconnect
    - Sync status indicator
25. Push notifications (crew app)

**Done when:** Crew can log in, see their job, complete the checklist, upload photos, flag items, and mark the job cleared. Owner sees everything in real time.

---

## Phase 4 — Documents and Payments
*Goal: Owner can generate and send all documents, receive payment*

26. Quote PDF generator (react-pdf)
    - Generate from project
    - Quote acceptance page
    - Send via Resend + Twilio SMS
27. Invoice PDF generator
    - Deposit and final invoice types
    - Auto increment CWG-0001
    - Send via Resend + Twilio SMS
28. Receipt PDF generator
    - Auto generated on payment confirmation
    - Send via Resend + Twilio SMS
29. Completion report PDF generator
    - Pull all photos, checklist, unexpected items
    - Generate branded report
    - Owner reviews before sending
    - Send via Resend
30. Mark payment received flow
    - Manual confirmation
    - Generates receipt
    - Advances project stage
    - Logs to timeline
31. Overdue invoice handling
    - Day 1 flag
    - Day 3 auto reminder
    - Day 7 auto reminder
    - Day 14 owner alert
32. Stripe integration (disabled by default)
    - Built but not active
    - Toggle in Settings → Finance

**Done when:** Owner can generate a quote, client can accept it, owner can invoice, receive payment confirmation, send receipt and completion report — all logged to timeline.

---

## Phase 5 — Communications
*Goal: All SMS and email triggers working automatically*

33. Twilio SMS integration
    - All 14 SMS triggers from 10-communications-sms-email.md
    - Delivery status webhooks
    - Opt out handling
    - Logging to sms_log and timeline
34. Resend email integration
    - All email triggers
    - Open and click webhooks
    - Logging to timeline
35. Scheduled SMS/emails via Supabase Edge Functions
    - Night before client reminder (7pm)
    - Night before crew reminder (6pm)
    - Review request (24hr after closed)
    - Review follow up (7 days)
    - Overdue reminders (day 3, 7, 14)
36. SMS toggles in settings

**Done when:** Every trigger in 10-communications-sms-email.md fires correctly and every communication appears in the client timeline.

---

## Phase 6 — Operations
*Goal: Full business operations in one place*

37. Finances module (owner only)
    - Summary cards
    - All invoices table
    - Overdue tab
    - Per project breakdown
    - CSV export
38. Team management
    - Team list
    - Team member profile
    - Pending invites
    - Deactivate member
39. Vendor directory
    - List, add, edit
40. Notifications centre
    - Bell icon with badge
    - Notification inbox
    - Mark as read
41. Push notifications (admin app)
    - Web push subscription
    - All owner notification triggers
42. Settings page
    - Business details
    - Finance settings
    - Notification toggles
    - Security / audit log

**Done when:** Owner has full visibility of finances, team, vendors, and all notifications working correctly.

---

## Phase 7 — Polish
*Goal: Production ready*

43. Mobile optimisation of admin app
    - Dashboard
    - Project stage change
    - Unexpected item decision
    - Crew assignment
    - Mark payment received
44. Error states and empty states throughout
45. Loading states and skeletons throughout
46. Security headers in next.config.js
47. Audit log viewer in Settings
48. Performance audit (Lighthouse)
49. PWA service worker optimisation
50. Final QA across both apps

**Done when:** Both apps are fast, handle errors gracefully, and are ready for real clients and crew.

---

## Cursor Prompt Per Phase

### How to start each phase
```
Working on Clear We Go internal ops platform.
Specs in /docs folder.
Currently building Phase [N].
Reference: docs/[relevant files]
Previous phases are complete and working.
Build [specific feature] now.
```

### Relevant docs per phase
- Phase 1: 00, 01, 02, 03
- Phase 2: 04, 05, 06, 08
- Phase 3: 07, 08
- Phase 4: 09, 11
- Phase 5: 10
- Phase 6: 11, 12, 13
- Phase 7: 14
