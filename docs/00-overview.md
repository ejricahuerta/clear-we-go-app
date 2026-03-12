# 00 — Overview

## What We Are Building
Two PWA apps for Clear We Go, a Toronto-based estate and property cleanout business.

## Business Details
- Business name: Clear We Go
- Phone: (581) 998-5673
- Website: clearwego.ca
- Email: noreply@clearwego.ca
- Billing email: billing@clearwego.ca
- Service area: Toronto, North York, Markham, Vaughan, Newmarket, Richmond Hill

## Four Services
1. **Estate Cleanout** — $2,800–$9,000
   Full-service clearing for executors and families settling an estate.
   Every item documented. Nothing disposed without authorization.
   Completion report included.

2. **Pre-Sale House Clearout** — $1,200–$4,500
   Property cleared and photo-ready before listing.
   One vendor, one price, no surprises.

3. **Tenant Move-Out** — $1,200–$3,500
   Documented clearing after tenant vacates.
   Full inventory and written report for property records.
   Volume pricing for property managers.

4. **Downsizing** — Custom pricing
   Helping families move a loved one into assisted living or smaller space.
   White-glove care, patient process.

## Two Apps

### App 1: app.clearwego.ca
- Internal admin tool
- Owner and admin only
- Desktop first, responsive
- Google OAuth + email/password login
- Full business operations

### App 2: crew.clearwego.ca
- Crew field app
- Crew only
- Mobile first PWA — installed to home screen
- Email/password only
- Job day operations only

Both apps share the same Supabase project and database.

## Three User Roles

### Owner
- Full access to everything
- Only role that sees finances
- Only role that invites and removes team
- Can delete records and export data
- Logs in with Google (admin app only)

### Admin
- Contacts, clients, projects, vendors
- Cannot see finances
- Can assign crew to projects
- Cannot manage team settings
- Logs in with email/password (admin app only)

### Crew
- Crew app only
- Sees only their assigned projects
- Checklist, photos, flag unexpected items
- Manages own availability
- Logs in with email/password (crew app only)
- Requires invite to create account

## Core Product Promise
"Nothing leaves a property without the client's knowledge and explicit approval."

This means every action on every project must be:
- Documented with photos
- Logged to the client timeline automatically
- Traceable to a specific crew member and timestamp
