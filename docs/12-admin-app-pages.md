# 12  - Admin App Pages

## URL: admin.clearwego.ca
Desktop first. Responsive for mobile key actions.
Dark sidebar navigation. White content area.

---

## Layout

### Sidebar (desktop)
- Clear We Go logo
- Navigation links (see below)
- User name and role at bottom
- Sign out button

### Top Bar (mobile)
- Hamburger menu
- Clear We Go logo
- Notification bell
- User avatar

### Navigation Links
1. Dashboard
2. Contacts
3. Clients
4. Projects
5. Team
6. Finances *(owner only)*
7. Vendors
8. Settings

---

## Dashboard

### 4 Summary Cards
```
Revenue This Month    Outstanding Invoices
$[amount]             $[amount]

Overdue Invoices      Active Projects
$[amount]             [count]
```

### Today's Projects
List of all projects where job_date = today:
- Service type badge
- Client name
- Address
- Crew assigned (names)
- Current stage
- Click to open project

### Follow Ups Due Today
Contacts where follow_up_date = today:
- Name, company, type
- Last contacted date
- Quick log outreach button

### Needs Attention
- Projects missing completion report
- Projects missing Google review
- Invoices overdue

---

## Contacts Page
See 04-contacts-module.md for full spec.

Quick summary:
- Stats bar (this month performance)
- View tabs: All | Follow Up Today | No Response | Responded
- CSV import button
- Sortable filterable list
- Batch actions
- Source performance table

---

## Clients Page

### List View
- Search by name, email, phone, address
- Filter by: client type, neighbourhood, referral source, review status
- Sort by: name, date added, total revenue, last project

### Client Profile Page
**Header**
- Name, type badge
- Phone, email (click to call/email)
- Address, neighbourhood
- Total revenue
- Google review status badge
- SMS opted out badge (if applicable)
- Edit button

**Projects Section**
- All linked projects
- Service type, date, stage, amount
- Click to open project
- Add new project button

**Timeline Section**
- Full chronological timeline
- See 05-clients-and-timeline.md for full spec
- Filter and search
- Export to PDF button (owner only)

**Notes Section**
- Add note button
- Notes list with author and timestamp

---

## Projects Page

### Kanban View
Columns: Inquiry | Walkthrough Booked | Quoted | Deposit Received | Scheduled | In Progress | Cleared | Report Sent | Review Requested | Closed

Each card shows:
- Client name
- Service type badge (colour coded)
- Address
- Job date
- Assigned crew

Drag to move between columns.
Stage change logs to timeline automatically.

### List View
- All projects
- Filter by: service type, stage, neighbourhood, date range
- Sort by: job date, client name, quote amount
- Search by: client name, address

### Project Detail Page
See 06-projects-module.md for full spec.

**Tabs:**
- Details (all fields + service specific)
- Crew (assignment + availability)
- Checklist (progress + items)
- Photos (before/after by room)
- Unexpected Items
- Documents (quote, invoice, receipt, report)
- Finances *(owner only)*
- Notes

---

## Team Page

### Team List
- Name, role badge, phone, email
- Status: Active / Pending / Inactive
- Jobs completed count
- Invite new member button

### Team Member Profile
- Contact details
- Role
- Weekly availability grid (read only for admin)
- Unavailable dates (read only for admin)
- Assigned projects (upcoming)
- Jobs completed history
- Edit availability (owner only)
- Deactivate button (owner only)

### Invite Flow
1. Click Invite Crew Member
2. Enter: name, email, role
3. Hit Send Invite
4. Email sent via Resend
5. Status shows as Pending until accepted
6. Resend invite option if 24 hours with no action

---

## Finances Page (Owner Only)

### Summary Cards
- Revenue this month
- Outstanding invoices
- Overdue invoices
- Profit this month

### All Invoices Table
- Invoice number, client, project, amount, status, due date
- Status colour coded: draft/sent/viewed/paid/overdue
- Click to view invoice detail
- Mark paid button on unpaid invoices

### Overdue Tab
- All overdue invoices
- Days overdue shown
- Send reminder button per invoice

### Per Project Breakdown
- Quote vs invoice vs actual
- Expenses per category
- Profit and margin

### CSV Export
- Filter by date range
- Export all finance data

---

## Vendors Page

### Vendor List
- Name, service type, contact name, phone, email
- Sort by service type
- Search by name

### Add/Edit Vendor
- Simple form
- Name, service type, contact name, phone, email, pricing notes, notes

---

## Settings Page

### Business
- Business name
- Phone number
- Email
- Address
- Logo upload (shown on all PDFs)
- Service area list

### Finance
- HST registered toggle
- HST number
- E-transfer email
- Default deposit percentage (default: 50%)
- Default payment terms (default: 7 days)
- Invoice footer message
- Stripe toggle and API key fields

### Notifications
- SMS toggles per trigger (see 10-communications-sms-email.md)
- Google review link (paste your Google review URL)

### Team
- Pending invites list
- Resend invite option
- Cancel invite option

### Security *(owner only)*
- Audit log viewer
- Filter by action type and date range

---

## Mobile Responsive Priority
These views must work on owner's phone:
1. Dashboard  - check status on the go
2. Project stage change  - advance stage from phone
3. Unexpected item decision  - approve/reject from phone
4. Crew assignment  - assign crew from phone
5. Mark payment received  - confirm payment from phone
