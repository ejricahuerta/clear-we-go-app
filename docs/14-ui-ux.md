# 14  - UI / UX

## Design Principles
- Clean, minimal, professional
- Function over decoration
- Fast to use  - crew are on a job site, not at a desk
- Every action should take as few taps/clicks as possible
- shadcn/ui components throughout

---

## Admin App (admin.clearwego.ca)

### Layout
- Dark sidebar (left, fixed)
- White/light grey content area
- Top bar on mobile (hamburger + logo + notifications)

### Sidebar
- Background: #0f172a (slate-900) or similar dark
- Active item: highlighted with accent colour
- Logo at top
- Nav links with icons
- User name and role at bottom
- Sign out

### Colour Palette
- Background: white (#ffffff)
- Sidebar: dark navy (#0f172a)
- Primary accent: use a professional blue or slate
- Success: green (#22c55e)
- Warning: amber (#f59e0b)
- Error/overdue: red (#ef4444)
- Text primary: #0f172a
- Text secondary: #64748b

### Typography
- Clean sans-serif (Inter or system font)
- Headings: semibold
- Body: regular
- Labels: small, uppercase, tracking-wide

### Cards and Tables
- Cards: white, subtle shadow, rounded corners
- Tables: clean rows, hover highlight
- Badges: rounded, colour coded by type

### Service Type Colours (used throughout)
- Estate Cleanout: purple
- Pre-Sale Clearout: blue
- Tenant Move-Out: orange
- Downsizing: teal

### Stage Colours (used in kanban and badges)
- Inquiry: grey
- Walkthrough Booked: blue
- Quoted: indigo
- Deposit Received: cyan
- Scheduled: amber
- In Progress: orange
- Cleared: lime
- Report Sent: green
- Review Requested: teal
- Closed: slate

---

## Crew App (crew.clearwego.ca)

### Layout
- Full screen mobile
- Bottom navigation bar (4 tabs)
- Large content area above nav
- No sidebar

### Bottom Nav
- Height: 64px
- Tab icons with labels
- Active tab: accent colour
- Inactive: grey

### Key UX Rules
- Minimum tap target: 44x44px
- Font size minimum: 16px body, 14px secondary
- Camera button: large, prominent, easy to hit with work gloves
- Checklist items: large touch targets, satisfying check animation
- Mark as Cleared: large, full-width button, sticky at bottom
- Loading states on every async action
- Success confirmation on every action (brief toast)
- Error messages: clear, actionable, not technical

### Offline State
- Show orange banner at top: "You're offline  - saving locally"
- Checklist items work and save offline
- Photos save to local storage offline
- On reconnect: show "Syncing [n] items..." then "All synced ✓"

### Photo Upload UX
- Tap room → choose Before or After → camera opens
- Photo taken → brief loading → thumbnail shown
- Green checkmark on success
- Retry button on failure
- Never lose a photo silently  - always show error if upload fails

### Flag Unexpected Item UX
- Prominent red/orange button always visible during job
- Modal: large camera button at top, description input below
- Submit uploads photo and description together
- Shows "Waiting for owner decision..." with spinner
- When owner decides: push notification + in-app update
- Clear visual: green "Keep" or red "Remove" badge

---

## Mobile Responsive (Admin App)

These pages must work well on owner's phone:

### Dashboard (mobile)
- Stack 4 cards 2x2
- Today's projects as scrollable list
- Follow ups as scrollable list
- Needs attention section

### Project Detail (mobile)
- Tab bar at top (scroll horizontally if needed)
- Stage change button prominent
- Unexpected item decision: large keep/remove buttons
- Crew assignment: searchable list

### Key Mobile Patterns
- Bottom sheet for forms instead of modals
- Pull to refresh on lists
- Swipe actions on list items (where appropriate)
- Floating action button for primary action per page

---

## PWA Manifest (Both Apps)

### Admin App manifest.json
```json
{
  "name": "Clear We Go Admin",
  "short_name": "CWG Admin",
  "description": "Clear We Go internal operations",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Crew App manifest.json
```json
{
  "name": "Clear We Go Crew",
  "short_name": "CWG Crew",
  "description": "Clear We Go crew field app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Add to Home Screen Prompt
On first visit to crew app (mobile):
- Show banner after 30 seconds or on second visit
- "Install Clear We Go on your home screen for quick access"
- Install button + dismiss

---

## Component Notes (shadcn/ui)
Use these shadcn components:
- Button, Input, Label, Textarea
- Select, Checkbox, Switch, RadioGroup
- Dialog, Sheet (bottom sheet on mobile)
- Table, Card
- Badge, Avatar
- Tabs
- Toast (for success/error messages)
- Command (for search)
- Calendar, DatePicker
- Skeleton (loading states)

---

## Loading and Empty States

### Loading
- Use Skeleton components (not spinners) for page loads
- Use spinner only for button actions
- Never show blank white screens

### Empty States
Each major section needs an empty state:
- No contacts: "No contacts yet. Import from Apollo to get started."
- No clients: "No clients yet. Convert a contact or add manually."
- No projects today: "No jobs scheduled today."
- No team members: "Invite your first crew member."

---

## Error States
- Form validation: inline, below field, red text
- API errors: toast notification, top right
- Network errors: "Something went wrong. Please try again."
- 404: Simple branded page, link back to dashboard
- Unauthorized: Redirect to login with message
