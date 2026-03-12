# 13 — Notifications

## Channels
1. **Push notifications** — Web Push API via Supabase Edge Functions
2. **SMS** — Twilio (see 10-communications-sms-email.md for templates)
3. **In-app** — Badge on notification bell in admin app nav

---

## Owner Notifications

### Immediate (real-time)
| Trigger | Message |
|---------|---------|
| Crew flags unexpected item | "Mike D. flagged an unexpected item at 123 Rosedale: [description]" |
| Project marked cleared by crew | "Mike D. marked the estate cleanout at 123 Rosedale as cleared." |
| Crew marks date unavailable (with conflict) | "Mike D. marked March 14 unavailable. You have an unassigned project that day." |
| Client replies to SMS | "Client replied: [preview]" |
| Client accepts quote | "John Smith accepted the quote for $3,200." |
| Invoice paid | "Payment received: $3,200 from John Smith (CWG-0001)" |

### Scheduled
| Trigger | Time | Message |
|---------|------|---------|
| Follow ups due today | 8:00am daily | "You have [n] contacts due for follow up today." |
| Invoice overdue — Day 1 | End of due date | "Invoice CWG-0001 is overdue ($3,200 — John Smith)" |
| Invoice overdue — Day 3 | Day 3 | Auto SMS sent to client. Owner notified. |
| Invoice overdue — Day 7 | Day 7 | Auto SMS sent again. Owner notified. |
| Invoice overdue — Day 14 | Day 14 | "Invoice CWG-0001 is 14 days overdue. Handle personally." |
| Unaccepted invite (24hr) | 24hr after send | "Your invite to Mike D. hasn't been accepted yet." |

---

## Crew Notifications

### Immediate
| Trigger | Message |
|---------|---------|
| Assigned to project | "New job assigned: Estate Cleanout, March 14 at 9am, 123 Rosedale Valley Rd" |
| Owner decides on unexpected item | "Decision received: [Keep / Remove] — [item description]" |

### Scheduled
| Trigger | Time | Message |
|---------|------|---------|
| Job day reminder | 6:00pm night before | "Reminder — job tomorrow at [time]: [service type] — [address]" |

---

## Notification Bell (Admin App)

Bell icon in top right of admin app nav.
Badge count shows unread notifications.

### Notification Inbox
- Reverse chronological list
- Each notification: icon, message, timestamp, linked resource
- Click notification → navigates to relevant page
- Mark as read on click
- Mark all as read button
- Clear all button
- Shows last 50 notifications

### Notification Types and Icons
- 🚩 Unexpected item flagged
- ✅ Project cleared
- 💬 Client replied to SMS
- 📋 Quote accepted
- 💰 Payment received
- ⚠️ Invoice overdue
- 📅 Follow ups due
- 👤 Crew availability conflict
- 📧 Invite not accepted

---

## Push Notification Setup

### Web Push (both apps)
- Request permission on first login
- Store push subscription in database per user
- Send via Supabase Edge Function

### push_subscriptions table
```sql
id              uuid primary key
user_id         uuid references users(id)
endpoint        text not null
p256dh          text not null
auth            text not null
created_at      timestamptz default now()
```

### Sending Push Notifications
Use web-push library in Supabase Edge Function:
```javascript
webpush.sendNotification(subscription, JSON.stringify({
  title: 'Clear We Go',
  body: message,
  icon: '/icon-192.png',
  badge: '/badge-72.png',
  data: { url: '/projects/[id]' }  // navigate on click
}))
```

---

## Notification Preferences

### Owner (Settings → Notifications)
Can toggle off any notification type individually.
Cannot disable: unexpected item flags, payment received.

### Crew (Crew App → Profile)
- Job assignment notifications: on/off
- Job day reminders: on/off
- Unexpected item decisions: always on (cannot disable)
