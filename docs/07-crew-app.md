# 07  - Crew App

## Overview
- URL: crew.clearwego.ca
- Mobile first PWA
- Installed to home screen
- Crew only  - no admin features
- Bottom navigation bar

---

## PWA Setup
- manifest.json with Clear We Go branding
- Service worker for offline support
- Add to home screen prompt on first visit
- Camera access for photo uploads
- Push notifications enabled
- Offline: cache today's jobs on login
- Offline: checklist works without signal
- Offline: photos saved locally, sync when back online
- Sync status indicator: "3 photos waiting to upload"

---

## Bottom Navigation
4 tabs:
1. **Today** (home)
2. **Upcoming**
3. **Availability**
4. **Profile**

---

## Today (Home Screen)

### If jobs assigned today
For each assigned project:
```
─────────────────────────────
[Service Type Badge]
123 Rosedale Valley Rd, Toronto
9:00 AM

Client instructions:
"Handle with care  - elderly items.
Do not remove items from master
bedroom without calling owner first."

Access: Lockbox  - code in app
[ View Access Details ]

[ Start Job ]
─────────────────────────────
```

### If no jobs today
```
No jobs scheduled today.

Next job: [date]  - [service type]
[address]
```

---

## Job Detail Page (after Start Job)

### Top Section
- Service type and address
- Start time
- Client special instructions
- Access type badge
- [ View Access Details ] button

### Access Details (expandable)
- Access type
- Instructions
- Lockbox code (tap to reveal)
- Building instructions
- Parking instructions

### Checklist Section
- Service specific checklist (auto loaded)
- Progress bar: "5 of 13 complete"
- Each item: tap to mark complete
  - Shows checkmark, crew name, timestamp
  - Cannot uncheck once completed
- Items in order  - cannot reorder

### Photo Upload Section
- List of rooms to photograph
- Each room has: Before | After toggle
- Tap camera icon to open camera directly
- Photo taken → uploads instantly
- Thumbnail shown on success
- Retry button if upload fails
- Offline: saves locally, syncs when connected

### Flag Unexpected Item Button
- Prominent button, always visible
- Opens modal:
  - Take photo (required)
  - Describe the item (required)
  - [ Submit ] button
- On submit:
  - Saved to unexpected_items table
  - Owner receives push notification immediately
  - Shows in list as "Pending decision"
- Owner decision shown in real time:
  - "Keep  - move to keep area"
  - "Remove  - proceed with disposal"
- Each decision logged to timeline

### Mark as Cleared Button
- Shown at bottom of checklist
- Only enabled when ALL checklist items are complete
- Shows count if not ready: "3 items remaining"
- On tap: confirmation screen
  ```
  Ready to mark this job as cleared?

  ✓ All 13 checklist items complete
  ✓ Before photos uploaded
  ✓ After photos uploaded

  [ Confirm  - Mark Cleared ]
  ```
- On confirm:
  - Project stage → Cleared
  - Owner receives push notification
  - Timeline event logged
  - Returns to Today screen
  - Job shows as completed

---

## Upcoming
- Next 7 days of assigned projects
- Simple list: date, service type, address, time
- Read only  - no actions

---

## Availability Page

### Weekly Schedule
- Toggle available/unavailable per day of week
- Set start and end time per day
- Saved immediately on change

### Mark Dates Unavailable
- Calendar view of next 30 days
- Tap a date to mark unavailable
- Select reason: Sick / Personal / Other
- Unavailable dates shown in red
- Tap again to remove

### Upcoming Assignments
- List of all upcoming assigned projects
- Date, service type, address

---

## Profile Page
- Name (read only)
- Phone (editable)
- Change password
- Notification preferences:
  - Job assignment notifications
  - Job day reminders
- App version number
- Sign out button

---

## UX Rules for Crew App
- Minimum tap target size: 44px
- Large readable text (min 16px body)
- Camera button always prominent
- Mark cleared button always visible (sticky)
- Error states clear and actionable
- Loading states on all async actions
- Success confirmation on every action
- Never show admin features even if accidentally accessed
- If no internet: show offline banner
  "You're offline  - checklist and photos save locally"
