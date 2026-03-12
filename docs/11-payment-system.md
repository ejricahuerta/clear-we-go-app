# 11 — Payment System

## Phase 1: E-Transfer (Launch With This)

### Why E-Transfer First
- Canadian clients expect it
- Estate lawyers and realtors pay by e-transfer or cheque
- Zero processing fees
- A $3,000 job on Stripe costs ~$87 in fees
- No corporate clients asking for credit card at launch

### Flow
```
Invoice generated → sent to client →
client e-transfers to billing@clearwego.ca →
owner receives in Gmail →
owner marks payment received in app →
receipt auto generated →
receipt sent to client →
timeline updated →
project stage advances
```

### Deposit Flow
- Default: 50% of quote amount (configurable in settings)
- Deposit invoice generated automatically when quote accepted
- Must be received before project is scheduled
- Remaining balance due on completion

### Mark Payment Received (Manual)
Owner opens project → Documents tab → Invoice → Mark Paid:
1. Enter amount received
2. Select payment method (e-transfer, cash, cheque)
3. Enter reference number (optional)
4. Select payment date
5. Hit confirm
6. System:
   - Updates invoice status → paid
   - Updates invoice.paid_at
   - Creates receipt record
   - Generates receipt PDF
   - Sends receipt via email and SMS
   - Logs to timeline: "Payment received: $[amount] via [method]"
   - If deposit: advances stage to Deposit Received
   - If final: advances stage to closed flow

---

## Overdue Handling

| Day | Action |
|-----|--------|
| Due date passes unpaid | Flag red on dashboard. Owner notification. |
| Day 3 overdue | Auto SMS + email reminder to client. Logged to timeline. |
| Day 7 overdue | Second SMS + email reminder. Owner notified again. |
| Day 14 overdue | Owner notified to handle personally. Project flagged as payment issue. |

---

## Invoice Numbering
- Format: CWG-0001
- Auto increment from settings.last_invoice_number
- Never reuse
- Receipts: CWG-R-0001 (separate counter)

---

## HST Settings
In Settings → Finance:
- HST registered toggle (yes/no)
- HST number field
- If registered: 13% HST added to all invoices
- If not registered: no tax shown

---

## Phase 2: Stripe (Disabled by Default)

### When to Enable
- Corporate clients ask for credit card
- Property management companies on vendor accounts
- Law firms paying by corporate card
- Estimated: 20+ jobs/month

### How to Enable
Settings → Finance → Stripe:
- Toggle Stripe enabled
- Enter Stripe publishable key
- Enter Stripe secret key
- Enter Stripe webhook secret
- Save — Pay Now button appears on all new invoices

### Stripe Flow
1. Invoice sent to client with Pay Now button
2. Client clicks → Stripe hosted checkout page
3. Client enters credit card
4. Payment processed
5. Stripe webhook fires → app receives confirmation
6. Invoice marked paid automatically
7. Receipt generated and sent
8. Timeline updated
9. Stripe fee recorded as expense in finances

### Stripe Fee Tracking
When Stripe payment received:
- Auto calculate fee: (amount × 0.029) + 0.30
- Record as expense in finances.other_expenses
- Label: "Stripe processing fee"

### Cost Warning
In Stripe settings panel:
```
Note: Stripe charges 2.9% + $0.30 per transaction.
On a $3,000 job this is $87.30.
Only enable when clients specifically request
credit card payment.
```

---

## Finance Dashboard (Owner Only)

### Summary Cards
- Revenue this month
- Outstanding invoices total
- Overdue invoices total
- Profit this month

### Tables
- All invoices with status (colour coded)
- Overdue invoices highlighted red
- Recent payments received

### Per Project
- Quote amount
- Invoice amount
- Expenses breakdown
- Gross profit
- Margin %

### Export
- All finance data to CSV
- Filter by date range
- For accountant and tax preparation
