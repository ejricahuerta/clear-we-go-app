# 03  - Security and Auth

## Authentication

### Admin App (admin.clearwego.ca)
- Owner: Google OAuth only
- Admin: Email/password only
- Session expires after 8 hours of inactivity
- Max 5 login attempts then 15 minute lockout
- All auth via NextAuth.js + Supabase Auth

### Crew App (crew.clearwego.ca)
- Email/password only
- No Google login
- Session expires after 24 hours
- Max 5 login attempts then 15 minute lockout
- Invite required to create account

### Password Rules
- Minimum 8 characters
- Must include one number
- Must include one special character
- Bcrypt hashing via Supabase Auth
- Reset link sent via Resend, expires 1 hour
- One time use reset links only

---

## Invite System

### Flow
1. Owner goes to Team in admin app
2. Fills in: name, email, role
3. Hits Send Invite
4. System:
   - Creates user record with status = pending
   - Generates token via crypto.randomBytes(32)
   - Stores SHA-256 hash of token in invites table
   - Sets expiry to 48 hours from now
   - Sends invite email via Resend
5. Crew receives email with link:
   crew.clearwego.ca/setup?token=[raw_token]
6. Crew sets password on setup page
7. Account created, invite marked accepted
8. Crew redirected to home screen

### Invite Email
```
Subject: You've been invited to Clear We Go

Hi [Name],

You've been added to the Clear We Go crew app.

Tap below to set up your account.

[ Set up my account ]

This link expires in 48 hours.

Clear We Go
crew.clearwego.ca
```

### Expired Invite Message
"This link has expired. Contact your manager for a new invite."

---

## Row Level Security (RLS)

Enable RLS on ALL tables in Supabase.

### users
- Owner: full read and write all users
- Admin: read all users, no write
- Crew: read and write own record only
- Crew: can only update own phone

### contacts
- Owner and admin: full read and write
- Crew: no access

### clients
- Owner and admin: full read and write
- Crew: no access

### timeline_events
- Owner and admin: read all, insert only
- Crew: no access
- NO updates or deletes for ANYONE ever
- Enforced at database level with trigger

### projects
- Owner and admin: full read and write
- Crew: read only where id in crew_assignments where user_id = auth.uid()

### project_details
- Owner and admin: full read and write
- Crew: read only on assigned projects

### project_access
- Owner and admin: full read and write
- Crew: read only on assigned projects

### project_photos
- Owner and admin: full read and write
- Crew: read all photos on assigned projects, insert only (no update or delete)

### unexpected_items
- Owner and admin: full read and write
- Crew: insert only on assigned projects, read own submissions only

### checklist_items
- Owner and admin: full read and write
- Crew: read and update (complete) on assigned projects only

### invoices
- Owner only: full read and write
- Admin: no access
- Crew: no access

### receipts
- Owner only: full read and write
- Admin: no access
- Crew: no access

### finances
- Owner only: full read and write
- Admin: no access
- Crew: no access

### crew_availability
- Owner and admin: full read
- Crew: read and write own records only

### crew_unavailable_dates
- Owner and admin: full read
- Crew: read and write own records only

### crew_assignments
- Owner and admin: full read and write
- Crew: read own assignments only

### sms_log
- Owner only: full read
- Admin: no access
- Crew: no access

### audit_log
- Owner only: read
- No one can insert directly (system only)
- No updates or deletes for anyone ever

### settings
- Owner: full read and write
- Admin: read only (non-sensitive keys)
- Crew: no access

---

## File Storage Security
- All photos and PDFs in private Supabase Storage bucket
- Signed URLs only, expire after 1 hour
- Crew can only upload to their assigned project folder
- Direct bucket access disabled
- Max file size: 10MB per photo
- Allowed types: jpg, png, webp only

---

## API Security
- All API routes verify session server side
- Role checked on every protected route
- Middleware protects all pages by role
- No sensitive data returned to client
- Rate limit: 100 requests per minute per user
- Photo uploads: 50 per project max

---

## Session Security
- JWT tokens stored in httpOnly cookies
- Not accessible via JavaScript
- CSRF protection via NextAuth
- Secure flag on all cookies
- SameSite: strict

---

## Middleware
Both apps need middleware that:
1. Checks for valid session on every protected route
2. Verifies role matches the app
   - Admin app: role must be owner or admin
   - Crew app: role must be crew
3. Redirects to login if not authenticated
4. Redirects to wrong-app page if wrong role

---

## Audit Log
Log these actions to audit_log automatically:
- login_success
- login_failed
- logout
- invite_sent
- invite_accepted
- role_changed
- project_deleted
- client_deleted
- finance_viewed
- data_exported
- password_reset_requested
- password_reset_completed
- stripe_keys_updated

Owner can view full audit log in Settings → Security.
Cannot be deleted by anyone.

---

## HTTPS and Headers
- HTTPS enforced via Vercel
- HTTP redirects to HTTPS automatically
- HSTS enabled
- Security headers via next.config.js:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
