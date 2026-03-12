# 10 — Communications: SMS and Email

## Overview
- SMS via Twilio (from Clear We Go Toronto number)
- Email via Resend (from noreply@clearwego.ca)
- Every SMS and email logged to sms_log table
- Every communication logged to client timeline automatically
- Twilio webhooks update delivery status
- Resend webhooks track email open and click

---

## SMS Opt Out
- If client replies STOP: Twilio handles automatically
- Update client.sms_opted_out = true
- No further SMS to that number
- Logged to timeline: "Client opted out of SMS"
- Still send emails unless client requests otherwise

---

## SMS Settings
In admin app Settings → Notifications:
Owner can toggle each SMS on or off individually.

---

## Client SMS Triggers

### 1. Quote Sent
Trigger: Owner sends quote
```
Hi [First Name], Clear We Go sent you a
quote for your [service type] at [address].
View and accept: [quote link]
Questions? Call (581) 998-5673
```

### 2. Quote Accepted Confirmation
Trigger: Client accepts quote
```
Hi [First Name], your quote is confirmed.
We'll be in touch to schedule your job.
Clear We Go — (581) 998-5673
```

### 3. Job Scheduled Confirmation
Trigger: Project stage → Scheduled
```
Hi [First Name], your [service type] is
scheduled for [date] at [time].
Address: [address]
Questions? Call (581) 998-5673
```

### 4. Job Reminder to Client
Trigger: Night before job at 7:00pm
```
Hi [First Name], reminder that your
Clear We Go team arrives tomorrow at [time].
Address: [address]
Questions? Call (581) 998-5673
```

### 5. Job Started
Trigger: Crew taps Start Job in crew app
```
Hi [First Name], your Clear We Go team
has arrived at [address] and the job
has started.
```

### 6. Unexpected Item Alert
Trigger: Crew flags unexpected item
```
Hi [First Name], your crew found something
unexpected: [item description].
Please call (581) 998-5673 to let us
know — keep or remove?
```

### 7. Job Cleared
Trigger: Crew marks project as Cleared
```
Hi [First Name], your [service type] at
[address] is complete. Your completion
report will be emailed within 24 hours.
Clear We Go — (581) 998-5673
```

### 8. Invoice Sent
Trigger: Owner sends invoice
```
Hi [First Name], your Clear We Go invoice
for $[amount] is ready: [invoice link]
E-transfer to billing@clearwego.ca
Include [CWG-XXXX] in the message.
Questions? (581) 998-5673
```

### 9. Overdue Reminder — Day 3
Trigger: Invoice unpaid 3 days past due
```
Hi [First Name], a friendly reminder that
invoice [CWG-XXXX] for $[amount] was due
on [date]. Please e-transfer to
billing@clearwego.ca
Questions? (581) 998-5673
```

### 10. Overdue Reminder — Day 7
Trigger: Invoice unpaid 7 days past due
```
Hi [First Name], your invoice [CWG-XXXX]
for $[amount] is now 7 days overdue.
Please contact us at (581) 998-5673.
```

### 11. Google Review Request
Trigger: 24 hours after project Closed
```
Hi [First Name], thank you for choosing
Clear We Go. If you're happy with the job,
a Google review means the world to us:
[google review link]
Thank you — Clear We Go
```

### 12. Review Follow Up
Trigger: 7 days after review request, if no review
```
Hi [First Name], just a gentle reminder —
we'd really appreciate a Google review:
[google review link]
Thank you — Clear We Go
```

---

## Crew SMS Triggers

### 13. Job Assignment
Trigger: Owner assigns crew to project
```
Hi [First Name], you have a new job:
[Service Type]
[Date] at [time]
[Address]
Open your app: crew.clearwego.ca
```

### 14. Job Reminder to Crew
Trigger: Night before job at 6:00pm
```
Hi [First Name], reminder — job tomorrow:
[Service Type] at [time]
[Address]
Open your app: crew.clearwego.ca
```

---

## Email Triggers

All emails sent from noreply@clearwego.ca via Resend.

### Quote Email
Subject: "Your Clear We Go quote — [service type] at [address]"
- Quote PDF attached
- Accept quote button
- Contact details

### Invoice Email
Subject: "Invoice [CWG-XXXX] — Clear We Go"
- Invoice PDF attached
- Payment instructions
- Contact details

### Receipt Email
Subject: "Payment received — Clear We Go"
- Receipt PDF attached
- Thank you message

### Completion Report Email
Subject: "Your completion report is ready — [address]"
- Completion report PDF attached
- Summary of work done
- Contact details for any questions

### Crew Invite Email
Subject: "You've been invited to Clear We Go"
- Setup link (expires 48 hours)
- Instructions

### Password Reset Email
Subject: "Reset your Clear We Go password"
- Reset link (expires 1 hour)
- One time use

---

## Scheduling
Use Supabase Edge Functions with cron for:
- Night before client reminder (7:00pm)
- Night before crew reminder (6:00pm)
- Google review request (24 hours after closed)
- Review follow up (7 days after first request)
- Overdue invoice reminders (day 3, 7, 14)

---

## Logging
Every outbound SMS:
- Saved to sms_log table
- Twilio webhook updates delivery status
- Logged to client or crew timeline

Every outbound email:
- Resend webhook fires on open
- Resend webhook fires on link click
- Both logged to client timeline

Every inbound SMS (client replies):
- Twilio webhook receives it
- Logged to timeline: "Client replied: [preview]"
- Owner receives push notification
