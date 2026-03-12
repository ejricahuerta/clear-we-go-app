# 01 — Tech Stack

## Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- Both apps are built in Next.js

## Authentication
- **NextAuth.js** — handles Google OAuth and email/password
- Google OAuth for owner (admin app)
- Email/password for admin (admin app)
- Email/password + invite system for crew (crew app)

## Database
- **Supabase** (Postgres)
- Row Level Security (RLS) enabled on all tables
- One Supabase project shared by both apps

## File Storage
- **Supabase Storage**
- Private bucket for photos and PDFs
- Signed URLs that expire after 1 hour

## Hosting
- **Vercel**
- Admin app: app.clearwego.ca
- Crew app: crew.clearwego.ca
- Auto deploys from GitHub
- HTTPS enforced, HSTS enabled

## SMS
- **Twilio**
- Provision one Toronto area code number
- Pay as you go (~$0.0079/SMS)
- Store: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

## Email
- **Resend**
- From: noreply@clearwego.ca
- Free tier: 3,000 emails/month
- Store: RESEND_API_KEY

## PDF Generation
- **react-pdf**
- Quotes, invoices, receipts, completion reports
- Stored in Supabase Storage after generation

## Payments
- **Phase 1:** E-transfer only (manual confirmation)
- **Phase 2:** Stripe (built but disabled by default)
- Store: STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

## PWA
- manifest.json on both apps
- Service worker for offline support
- Add to home screen prompt on first visit
- Camera access for crew photo uploads
- Push notifications via Web Push API

## Push Notifications
- **Supabase Edge Functions** + Web Push API

## Environment Variables Required
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google OAuth (admin app only)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Resend
RESEND_API_KEY=

# Stripe (disabled until phase 2)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Project Structure
```
/clearwego-admin   (app.clearwego.ca)
  /app
  /components
  /lib
  /docs            (these spec files)

/clearwego-crew    (crew.clearwego.ca)
  /app
  /components
  /lib
```

Both projects point to the same Supabase URL and anon key.
