# 08 — Availability System

## Purpose
Ensure owner always knows who is free before assigning crew to a project.
Prevent double bookings and scheduling conflicts automatically.

---

## Two Types of Availability

### 1. General Weekly Schedule
Set once. Updated by crew member.
"I work Monday, Wednesday, Friday, 8am–5pm"

### 2. Specific Date Exceptions
Set as needed. Updated by crew member.
"I can't do March 20 — personal"

---

## Availability Query Logic

When owner opens Assign Crew for a project:

Show crew member as **Available** if ALL three conditions are true:
1. `crew_availability.day_of_week` matches project job_date AND `available = true`
2. No record in `crew_unavailable_dates` for that date
3. No existing `crew_assignment` for that date (not on another project)

Show crew member as **Unavailable** with reason if ANY condition fails:
- "Not available on [day of week]" — general schedule
- "Marked unavailable — [reason]" — specific date
- "Already assigned to Project #XXXX on [date]" — existing booking

---

## Assign Crew UI (Admin App)

On project detail page → Crew tab:

```
Assign Crew — Thursday March 14, 9:00 AM

AVAILABLE (2)
● Mike D.     Full Time    ✓ Free Mar 14    [ Assign ]
● Sara K.     Part Time    ✓ Free Mar 14    [ Assign ]

UNAVAILABLE (2)
✗ James R.   On Call      Marked unavailable (sick)
✗ Tony M.    Part Time    Already assigned — Project #0011
```

- Click Assign to add crew member
- Can assign multiple crew to one project
- Assigned crew shown at top of section
- Remove button per assigned crew member

---

## Notifications

### When Crew Marks Date Unavailable
- System checks if any unassigned project exists on that date
- If yes: owner receives push notification:
  ```
  Availability Update
  Mike D. marked March 14 unavailable (sick).
  You have an unassigned project on that date:
  Estate Cleanout — 123 Rosedale Valley Rd
  ```

### When Owner Assigns Crew
- Crew member receives push notification immediately:
  ```
  New Job Assigned
  Estate Cleanout
  Thursday March 14 at 9:00 AM
  123 Rosedale Valley Rd, Toronto
  Open your app for details.
  ```
- SMS also sent (see 10-communications-sms-email.md)
- Logged to project timeline: "Crew assigned: [name]"

### Night Before Reminder to Crew (6pm)
- Auto SMS + push to all assigned crew:
  ```
  Reminder — job tomorrow at 9:00 AM
  Estate Cleanout — 123 Rosedale Valley Rd
  Open your app: crew.clearwego.ca
  ```

---

## Crew Availability Management (Crew App)

See 07-crew-app.md → Availability Page for UI spec.

### Weekly Schedule
- Toggle per day of week
- Set start and end time
- Saved immediately

### Mark Date Unavailable
- Calendar view
- Tap date → select reason
- Saves to crew_unavailable_dates
- Owner notified if conflict exists

---

## Edge Cases

### Crew Removed from Project
- crew_assignment record deleted
- Crew notified via push notification:
  "You have been removed from the March 14 job.
   Contact your manager for details."
- Logged to project timeline

### Project Date Changed
- All crew_assignments for that project updated to new date
- Availability re-checked for new date
- If any assigned crew unavailable on new date:
  - Owner notified immediately
  - Crew shown as conflicted on assign crew UI
  - Owner must resolve before proceeding

### Crew Deactivated
- All future crew_assignments removed
- Owner notified of any upcoming projects affected
