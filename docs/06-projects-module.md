# 06  - Projects Module

## What is a Project
A project is a booked or in-progress job for a client.
Previously called "jobs"  - use "project" throughout the app.

---

## Project Stages
```
Inquiry → Walkthrough Booked → Quoted → Deposit Received →
Scheduled → In Progress → Cleared → Report Sent →
Review Requested → Closed
```

Every stage change:
- Logged to client timeline automatically
- Triggers relevant SMS/email (see 10-communications-sms-email.md)

---

## Project Views in Admin App

### Kanban View
- Columns = stages
- Cards show: client name, service type, address, job date
- Drag to move between stages
- Colour coded by service type

### List View
- All projects sortable and filterable
- Filter by: service type, stage, neighbourhood, date range
- Search by: client name, address

---

## Project Detail Page

### Header
- Client name (linked to client profile)
- Service type badge
- Current stage with stage change button
- Property address
- Job date and start time

### Sections

**Details Tab**
- All project fields
- Service specific fields (see below)
- Key and access section

**Crew Tab**
- Assigned crew with availability status
- Assign/unassign crew button
- See 08-availability-system.md

**Checklist Tab**
- Service specific checklist
- Progress: "8 of 13 complete"
- Each item: text, completed by, completed at

**Photos Tab**
- Before and after photos grouped by room
- Side by side comparison layout
- Download all button (owner/admin)

**Unexpected Items Tab**
- All flagged items
- Photo, description, decision, decided by, timestamp
- Pending items highlighted

**Documents Tab**
- Quote (generate, send, view status)
- Invoice (generate, send, view status)
- Receipt (auto generated on payment)
- Completion report (generate after cleared, send)

**Finances Tab** (owner only)
- All cost fields
- Calculated totals
- Profit margin

**Notes Tab**
- Freeform notes
- Each note: text, author, timestamp

---

## Service Specific Fields

### Estate Cleanout
- Executor name
- Estate lawyer name
- Authorization document received (toggle)
- Pre-approved items list provided (toggle)
- Items flagged for keep (toggle)
- Items donated (toggle)
- Items disposed (toggle)

### Pre-Sale Clearout
- Listing agent name
- Listing date
- Photo shoot date
- Property photo-ready confirmed (toggle)
- Staging required after clearout (toggle)

### Tenant Move-Out
- Property manager name
- Number of units
- Volume pricing applied (toggle)
- Tenant vacate date
- Written inventory report sent (toggle)
- Property damage noted (toggle)

### Downsizing
- Moving to (Assisted Living / Smaller Home / Family Home)
- Family members involved (toggle)
- Sensitive items flagged (toggle)
- Items moved to new location (toggle)
- Items donated (toggle)
- Items disposed (toggle)

---

## Key and Access Section
On every project detail page:
- Access type (key, lockbox, owner present, realtor lockbox, building fob)
- Received from (name)
- Received date
- Lockbox code (encrypted, shown masked with reveal button)
- Building access instructions
- Parking instructions
- Key returned to (name)
- Key returned date

All key events logged to timeline automatically.
Owner notified when key received and when returned.

---

## Checklists

Auto-created when project is created based on service type.

### Estate Cleanout Checklist
1. Authorization document verified
2. Pre-approved items list reviewed
3. Walk through all rooms with client list
4. Before photos  - every room
5. Items sorted: keep, donate, dispose
6. Flagged items confirmed with client
7. Bin loaded
8. Donation items set aside
9. After photos  - every room
10. Property swept and clean
11. All doors and windows locked
12. Keys returned or secured
13. Mark as cleared

### Pre-Sale Clearout Checklist
1. Before photos  - every room
2. Items removed per client instructions
3. Staging items left in place
4. Bin loaded
5. After photos  - every room
6. Property photo-ready confirmed
7. All doors and windows locked
8. Keys returned or secured
9. Mark as cleared

### Tenant Move-Out Checklist
1. Before photos  - every room
2. Document all items left by tenant
3. Note any property damage with photos
4. Items removed and disposed
5. Bin loaded
6. After photos  - every room
7. Written inventory completed
8. All doors and windows locked
9. Keys returned to property manager
10. Mark as cleared

### Downsizing Checklist
1. Sensitive items identified and set aside
2. Before photos  - every room
3. Items sorted: move, donate, dispose
4. Moving items packed and labelled
5. Flagged items confirmed with family
6. Bin loaded
7. Donation items set aside
8. After photos  - every room
9. Moving items dispatched to new location
10. Property swept and clean
11. All doors and windows locked
12. Mark as cleared

---

## Google Review Automation
When project stage moves to Closed:
- Wait 24 hours
- Auto send review request via SMS + email
- If no review after 7 days: send one follow up
- Both attempts logged to timeline
- review_requested = true on first send
- review_received = true when owner manually confirms
