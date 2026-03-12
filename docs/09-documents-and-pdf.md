# 09 — Documents and PDF

## Overview
All PDFs generated using react-pdf.
Stored in Supabase Storage (private bucket).
Sent to clients via Resend email + Twilio SMS link.
Every document event logged to client timeline.

---

## Invoice Numbering
- Format: CWG-0001 (auto increment)
- Stored in settings as last_invoice_number
- Never reuse a number
- Receipts: CWG-R-0001 (separate counter)

---

## Quote PDF

### When Generated
Owner clicks "Generate Quote" on project detail page.

### Contents
```
[Clear We Go Logo]

QUOTE
Quote #: CWG-Q-0001
Date: [date]
Valid until: [date + 7 days]

Prepared for:
[Client First Last]
[Property Address]
[Email] | [Phone]

─────────────────────────────

Service: [Service Type]
Property: [Address]
Property Size: [Size]
Scheduled: [Date if known, or TBD]

What's Included:
✓ Full crew for the day
✓ Bin rental and disposal
✓ Photo documentation (before and after)
✓ Completion report within 24 hours
✓ Fully insured

─────────────────────────────

TOTAL: $[amount]
[+ HST $[amount] if registered]
[GRAND TOTAL: $[amount]]

─────────────────────────────

To accept this quote, click the link below
or call us at (581) 998-5673.

[ Accept Quote — [link] ]

Quote valid for 7 days from issue date.

─────────────────────────────

Clear We Go
(581) 998-5673
clearwego.ca
noreply@clearwego.ca
```

### Quote Acceptance Page
- Simple page at app.clearwego.ca/quote/[token]
- Shows quote summary
- "I accept this quote" button
- On accept:
  - quote_accepted logged to timeline
  - Project stage → Quoted
  - Owner notified
  - Deposit invoice auto generated

---

## Invoice PDF

### When Generated
Owner clicks "Generate Invoice" on project documents tab.
Two types: deposit (50% default) or final.

### Contents
```
[Clear We Go Logo]

INVOICE
Invoice #: CWG-0001
Date: [date]
Due: [date + payment terms days]

Bill To:
[Client First Last]
[Property Address]
[Email] | [Phone]

─────────────────────────────

Project: [Service Type]
Property: [Address]
Job Date: [date]

─────────────────────────────

Description                    Amount
Labour and crew                $[x]
Bin rental and disposal        $[x]
Documentation and report       $[x]
[Additional items if any]      $[x]

─────────────────────────────

Subtotal:                      $[x]
[HST (13%):                    $[x]]
TOTAL:                         $[x]

─────────────────────────────

Payment Instructions:
Send Interac E-Transfer to:
billing@clearwego.ca

Please include invoice number
CWG-0001 in the transfer message.

Payment due by [date].

─────────────────────────────

[Custom footer message from settings]

Clear We Go | (581) 998-5673 | clearwego.ca
```

---

## Receipt PDF

### When Generated
Auto generated when owner marks payment received.

### Contents
```
[Clear We Go Logo]

RECEIPT
Receipt #: CWG-R-0001
Date: [payment date]

Received From:
[Client First Last]
[Property Address]

─────────────────────────────

Invoice #: CWG-0001
Service: [Service Type]
Property: [Address]
Job Date: [date]

─────────────────────────────

Amount Paid:     $[amount]
Payment Method:  E-Transfer
Reference:       [reference if provided]

✓ PAID IN FULL

─────────────────────────────

Thank you for choosing Clear We Go.
Nothing leaves without a record.

Clear We Go | (581) 998-5673 | clearwego.ca
```

---

## Completion Report PDF

### When Generated
Owner clicks "Generate Completion Report" after project is Cleared.
Owner reviews before sending to client.

### Contents
```
[Clear We Go Logo]

COMPLETION REPORT
Project #: [project id]
Date: [report date]
Service: [Service Type]

─────────────────────────────

CLIENT
[Client First Last]
[Property Address]
[Email] | [Phone]

─────────────────────────────

JOB DETAILS
Job Date:     [date]
Crew:         [crew member names]
Duration:     [start to cleared time]
Rooms Cleared: [list of rooms]

─────────────────────────────

DOCUMENTATION

[For each room:]

ROOM: [Room Name]
Before:  [photo]     After:  [photo]
[side by side layout]

─────────────────────────────

UNEXPECTED ITEMS LOG
[If none: "No unexpected items were found."]

[If any:]
Item: [description]
Photo: [photo]
Decision: [Keep / Remove]
Decided by: [name] at [time]

─────────────────────────────

ITEMS SUMMARY
Kept:     [n items — description]
Donated:  [n items — vendor name]
Disposed: [n items — vendor name]

─────────────────────────────

CHECKLIST CONFIRMATION
All [n] checklist items completed. ✓

KEY RETURN
[If applicable:]
Keys returned to: [name]
Date: [date] at [time]

─────────────────────────────

CREW CONFIRMATION
This project was completed by:
[Crew member name] — [role]
[Crew member name] — [role]

─────────────────────────────

"Nothing leaves without a record."

Clear We Go | (581) 998-5673 | clearwego.ca

Report generated: [timestamp]
```

---

## Document Storage
All PDFs stored in Supabase Storage:
```
/documents
  /quotes/[project_id]/[quote_id].pdf
  /invoices/[project_id]/[invoice_id].pdf
  /receipts/[project_id]/[receipt_id].pdf
  /reports/[project_id]/[report_id].pdf
```

Signed URLs used for all access.
URLs expire after 1 hour.
