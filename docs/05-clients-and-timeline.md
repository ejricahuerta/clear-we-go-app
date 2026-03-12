# 05 — Clients and Timeline

## What is a Client
A client is a converted contact or direct inquiry
who has at least one project associated with them.

---

## Client Profile Page
- Contact details (editable)
- All linked projects
- Full chronological timeline
- Total revenue (calculated from projects)
- Google review status
- SMS opt out status
- Notes field

---

## Client Timeline

### Rules
- Append only. No edits. No deletes. Ever.
- Every event logged automatically — no manual logging required
- Every event has exact timestamp, who did it, what happened

### Display
- Reverse chronological order (newest first)
- Grouped by date
- Colour coded by category:
  - Contact events → grey
  - Client events → blue
  - Project stage changes → purple
  - Crew events → orange
  - Communication events → green
  - Document events → yellow
  - Finance events → teal
  - Review events → gold
  - System events → light grey

### Each Event Shows
- Icon matching category
- Event description (human readable)
- Timestamp (exact time shown on hover)
- Created by: name and role
- Expandable details section
- Photos inline if attached
- SMS or email preview if communication event

### Filter Options
- All events
- Project events only
- Communication only
- Documents only
- Finance only
- Date range picker

### Search
Full text search across all event descriptions and details.

### Export
Owner can export full client timeline to PDF.
Used for executor documentation and legal records.
Branded Clear We Go PDF with all photos included.

---

## Full Event List

### Contact Events
| Event Type | Description |
|-----------|-------------|
| contact_created | "Contact created by [name]" |
| contact_outreach_logged | "Outreach logged: Email [1/2/3] sent by [name]" |
| contact_follow_up_sent | "Follow up sent to [name] via [method]" |
| contact_responded | "[Name] responded to outreach" |
| contact_converted | "Contact converted to client by [name]" |
| contact_marked_dead | "Contact marked as dead by [name]" |

### Client Events
| Event Type | Description |
|-----------|-------------|
| client_created | "Client profile created by [name]" |
| client_updated | "Client details updated by [name]: [what changed]" |
| client_note_added | "Note added by [name]: [preview]" |
| client_sms_opted_out | "Client opted out of SMS" |

### Project Events — Stage Changes
| Event Type | Description |
|-----------|-------------|
| project_created | "Project created by [name]: [service type] at [address]" |
| project_stage_changed | "Project moved from [old] to [new] by [name]" |
| project_walkthrough_scheduled | "Walkthrough scheduled for [date] at [time]" |
| project_walkthrough_completed | "Walkthrough completed by [name]" |
| project_updated | "Project updated by [name]: [what changed]" |
| project_note_added | "Note added by [name]: [preview]" |

### Crew Events
| Event Type | Description |
|-----------|-------------|
| crew_assigned | "Crew assigned: [crew name] by [admin name]" |
| crew_unassigned | "Crew removed: [crew name] by [admin name]" |
| crew_notified | "SMS sent to [crew name] — job assignment" |
| crew_reminded | "SMS reminder sent to [crew name]" |
| project_started | "[Crew name] started the project at [time]" |
| checklist_item_completed | "[Crew name] completed: [item]" |
| before_photos_uploaded | "[Crew name] uploaded [n] before photos for [room]" |
| after_photos_uploaded | "[Crew name] uploaded [n] after photos for [room]" |
| unexpected_item_flagged | "[Crew name] flagged unexpected item: [description]" |
| unexpected_item_decision | "[Name] decided: [keep/remove] for [item]" |
| client_notified_unexpected | "Client notified of unexpected item via [method]" |
| project_cleared | "[Crew name] marked project as cleared at [time]" |

### Service Specific Events

**Estate Cleanout**
| Event Type | Description |
|-----------|-------------|
| authorization_document_received | "Authorization document received from [executor name]" |
| preapproved_list_received | "Pre-approved items list received" |
| items_flagged_for_keep | "[n] items flagged for keep" |
| items_donated | "[n] items donated to [vendor]" |
| items_disposed | "[n] items disposed via [vendor]" |

**Pre-Sale Clearout**
| Event Type | Description |
|-----------|-------------|
| listing_date_set | "Listing date set for [date]" |
| photo_shoot_date_set | "Photo shoot date set for [date]" |
| property_photo_ready_confirmed | "Property confirmed photo-ready by [name]" |

**Tenant Move-Out**
| Event Type | Description |
|-----------|-------------|
| tenant_vacate_date_confirmed | "Tenant vacate date confirmed: [date]" |
| property_damage_noted | "Property damage noted during clearout" |
| inventory_report_sent | "Written inventory report sent to [PM name]" |

**Downsizing**
| Event Type | Description |
|-----------|-------------|
| sensitive_items_flagged | "[n] sensitive items flagged for special handling" |
| items_moved_to_new_location | "[n] items moved to [location]" |

### Key and Access Events
| Event Type | Description |
|-----------|-------------|
| key_received | "Key received from [name] on [date]" |
| lockbox_code_set | "Lockbox code set for project" |
| key_returned | "Key returned to [name] on [date]" |

### Communication Events
| Event Type | Description |
|-----------|-------------|
| sms_sent | "SMS sent to client: [preview]" |
| sms_delivered | "SMS delivered to client" |
| sms_failed | "SMS failed to deliver: [reason]" |
| email_sent | "Email sent to client: [subject]" |
| email_opened | "Client opened email: [subject]" |
| email_link_clicked | "Client clicked link in email: [subject]" |
| client_called | "Client called by [name]: [notes]" |
| client_replied_sms | "Client replied to SMS: [preview]" |

### Document Events
| Event Type | Description |
|-----------|-------------|
| quote_generated | "Quote generated by [name]: $[amount]" |
| quote_sent | "Quote sent to client via [method]" |
| quote_viewed | "Client viewed quote" |
| quote_accepted | "Client accepted quote" |
| quote_expired | "Quote expired without acceptance" |
| completion_report_generated | "Completion report generated by [name]" |
| completion_report_sent | "Completion report sent to client" |
| completion_report_viewed | "Client viewed completion report" |
| invoice_generated | "Invoice [CWG-XXXX] generated: $[amount]" |
| invoice_sent | "Invoice sent to client via [method]" |
| invoice_viewed | "Client viewed invoice" |
| invoice_overdue | "Invoice overdue — [n] days past due" |
| receipt_generated | "Receipt [CWG-R-XXXX] generated" |
| receipt_sent | "Receipt sent to client" |

### Finance Events
| Event Type | Description |
|-----------|-------------|
| deposit_received | "Deposit received: $[amount] via [method]" |
| final_payment_received | "Final payment received: $[amount] via [method]" |
| payment_method_noted | "Payment method recorded: [method]" |

### Review Events
| Event Type | Description |
|-----------|-------------|
| review_request_sent | "Google review request sent via [method]" |
| review_follow_up_sent | "Review request follow up sent" |
| review_received | "Google review received: [rating] stars" |

### System Events
| Event Type | Description |
|-----------|-------------|
| data_exported | "Client data exported by [name]" |
| project_assigned_to_client | "Project linked to client profile" |
