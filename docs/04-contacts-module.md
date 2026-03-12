# 04 — Contacts Module

## Purpose
Track outreach contacts before they become clients.
200 contacts imported per month from Apollo.io.
This is NOT a full CRM — it is a simple outreach tracker.

---

## Contact Lifecycle
```
New → Contacted → Responded → Converted → [becomes Client]
                             → Dead
```

---

## Views

### All Contacts (default)
- Sortable list
- Filter by: status, type, neighbourhood, found_via
- Search by: name, company, email
- Colour coded status badges:
  - New → grey
  - Contacted → blue
  - Responded → green
  - Converted → gold
  - Dead → red

### Follow Up Today
- Contacts where follow_up_date = today
- Sorted by type (lawyers first, then realtors, then PMs)
- This is the daily outreach list
- Highlighted prominently — this is the most important view

### No Response
- Email 1 sent but no response
- Last contacted 5+ days ago
- Not yet dead
- These need email 2

### Responded
- Status = responded
- Not yet converted
- Priority list — act on these fast

---

## Bulk CSV Import
- Upload CSV button on contacts page
- Auto-map Apollo CSV columns to contact fields
- Apollo standard columns:
  - First Name → first_name
  - Last Name → last_name
  - Company → company
  - Title → type (map automatically)
  - Email → email
  - Phone → phone
  - City → neighbourhood (best match)
- Preview import before confirming
- Duplicate detection on email AND phone:
  - Check against existing contacts
  - Show count: "177 new, 23 duplicates"
  - Per duplicate options: Skip | Update existing | Import as new
- Import confirmation with summary
- All imported contacts start as status = new
- Bulk import logged to audit_log

---

## Sequence Tracking
Simple 3-email sequence per contact.

Progress indicator per contact:
```
Email 1 → Email 2 → Email 3 → Response
```

### Log Outreach Button (per contact)
When owner or admin clicks Log Outreach:
- Select which email sent: 1, 2, or 3
- Auto updates:
  - email_N_sent = true
  - email_N_date = now
  - last_contacted_date = now
  - follow_up_date = today + 5 days
  - status → contacted (if was new)

No automation. Owner sends emails manually from Gmail.
App just tracks what was sent and when.

---

## Batch Actions
- Select multiple contacts via checkbox
- Select all on page
- Batch actions:
  - Mark as contacted (sets email_1_sent, updates dates)
  - Mark as dead
  - Set follow up date (date picker)
  - Mark email 1 / 2 / 3 sent
  - Export selected to CSV

---

## Convert to Client
One click on any contact:
1. Opens confirm dialog
2. On confirm:
   - Creates new client profile
   - Copies: first_name, last_name, email, phone, neighbourhood
   - Sets client referral_source = contact.found_via
   - Links contact.client_id = new client id
   - Sets contact.converted_to_client = true
   - Sets contact.status = converted
   - Logs to client timeline:
     "Converted from contact — originally found via [source]"
3. Redirects to new client profile

---

## Simple Analytics
Stats bar at top of contacts page:

```
This Month:
Added: 200 | Contacted: 145 | Responded: 12 | Converted: 2 | Rate: 1%
```

Source performance table below stats:
```
Source        | Added | Responded | Converted | Rate
Apollo        | 150   | 9         | 1         | 0.7%
Realtor.ca    | 30    | 2         | 1         | 3.3%
LinkedIn      | 20    | 1         | 0         | 0%
```

---

## Individual Contact Profile
- All contact fields editable
- Sequence progress bar
- Log outreach button
- Convert to client button
- Mark as dead button
- Notes field
- Activity log (manual notes only — not full timeline)
  - Each note shows: text, who added it, timestamp
