# PRD: stockd — Household Supply Tracker

---

## Overview

| Field | Detail |
|---|---|
| Product Name | stockd |
| Owner | Personal Project |
| Platform | Web App (Next.js, browser-based) |
| Users | 2 (shared household) |
| Status | V1 Live |
| Deployed | Vercel |
| Stack | Next.js 15 + TypeScript + Tailwind + Supabase |

---

## Background

The user owns a dog and a cat, each requiring multiple consumable supplies on different replenishment cycles. Purchases were reactive — items bought when they ran out or when the user happened to remember. This led to last-minute purchases, forgotten items (particularly cat litter sand), and inconsistent stock management.

stockd solves this through a semi-automated tracking system that monitors estimated stock levels, prompts check-ins, and proactively triggers reminders before supplies run out.

The system is extensible — beyond pet supplies, it tracks any household consumable (detergent, toilet paper, etc.) with configurable categories, usage cycles, and quantities.

---

## Goals

1. Never run out of any supply item — purchases made at least **5 days in advance**.
2. Reduce cognitive load by automating stock estimation and reminders.
3. Support a **2-person household** with shared visibility into stock levels and purchase history.
4. Enable smart purchase flow with price confirmation before ordering.

---

## What's Built (V1)

### Auth & Household Setup
- Email/password authentication via Supabase
- 2-step signup: create account → create household or join via invite code
- Household invite code system for adding a second member

### Dashboard
- Items grouped by category
- Realtime sync between household members (Supabase realtime)
- Reminders section showing warning/urgent items
- Inline category name editing

### Category Management
- Create new categories from the dashboard (+ category button)
- Categories have a custom icon (emoji) and name
- Inline category name editing on the dashboard

### Item Management
- Add items with: name, category, tracking mode, unit, stock, usage rate, cycle length, product URL, last price, default buyer
- New category can be created inline when adding an item

### Tracking Modes

**Depletion mode** — stock physically runs down over time (food, medicine, poop bags).
- Tracks current quantity against average usage rate
- Displays days remaining and depleting progress bar

**Cycle mode** — scheduled repurchase (toilet sand, detergent).
- Tracks time elapsed since last purchase against a fixed reorder interval
- Displays next due date and filling progress bar

| Mode | Display | Reminder trigger | Check-in action |
|---|---|---|---|
| Depletion | Stock remaining + days left | Days left ≤ 5 | Update current stock amount |
| Cycle | Time elapsed toward next due date | Days until due ≤ 5 | "Mark bought" — resets cycle clock |

### Purchase Lifecycle

**Step 1 — Confirm buy:**
- User confirms purchase after 5% price variance check
- Stock updates optimistically; item enters "ordered" state (dashed teal border)
- Reminder dismissed; no further follow-ups

**Step 2 — Mark arrived:**
- User taps "mark arrived" when item physically arrives
- Modal pre-fills ordered quantity; user can edit before confirming
- Stock finalized to actual received quantity; card returns to normal state

### Buyer Assignment
- Each item has a designated buyer: specific household member or "alternate each time"
- Assigned buyer shown on item card and in reminders
- Alternate mode rotates assignment after each confirmed purchase

### Modals
- Add item
- Add category (standalone, from dashboard header)
- Check-in (update stock)
- Buy confirm (5% price variance check)
- Mark arrived (finalize received quantity)

### UX Details
- Add item modal asks "Discard this item?" before closing if name has been typed
- Design tokens match original mockup (--bg: #f7f6f2, blue: #185FA5, etc.)

---

## Database Schema (Supabase)

Tables: `households`, `profiles`, `categories`, `items`, `check_ins`, `purchases`

RLS policies use `security definer` functions to avoid recursion:
- `setup_household()` — creates household + profile on signup
- `join_household()` — joins by invite code + creates profile
- `get_my_household_id()` — used in profiles policy to avoid infinite recursion

---

## V1 Defaults (Supply Items)

| Category | Item | Tracking Mode |
|---|---|---|
| Dog (e.g. Mochi) | Food | Depletion |
| Dog | Poop Bags | Depletion |
| Dog | Medicine | Depletion |
| Cat (e.g. Bori) | Food | Depletion |
| Cat | Toilet Sand | Cycle |

---

## Acceptance Criteria Status

### US-10: Purchase & restock lifecycle ✅
- AC-10-01 ✅ Stock updates optimistically; item enters "ordered" state
- AC-10-02 ✅ Ordered state visible to both members via realtime sync
- AC-10-03 ✅ "Mark arrived" button replaces "buy now" in ordered state
- AC-10-04 ✅ Mark arrived modal pre-fills ordered quantity
- AC-10-05 ✅ Stock finalized to actual received quantity on confirm
- AC-10-06 ⬜ Deviation logging not yet implemented

### US-09: Per-item tracking mode ✅
- AC-9-01 ✅ Depletion / Cycle selection when adding item
- AC-9-02 ✅ Depletion mode shows stock, days remaining, progress bar
- AC-9-03 ✅ Cycle mode shows elapsed time, next due date, progress bar
- AC-9-04 ✅ Cycle mode hides stock/usage rate fields
- AC-9-05 ✅ Check-in updates stock; mark bought resets cycle clock
- AC-9-06 ✅ Reminder triggered at ≤ 5 days for both modes

### US-01: Supply Item Setup ✅
- AC-1-01 ✅ Add item with all fields
- AC-1-02 ✅ Estimated depletion date calculated and displayed
- AC-1-03 ✅ Both users can view and edit items

### US-06: Personalized category names ✅
- AC-6-01 ⬜ Onboarding does not prompt category naming (categories added manually)
- AC-6-02 ✅ Category names editable inline on dashboard
- AC-6-03 ⬜ Notifications not yet implemented

### US-07: Extensible item and category management ✅
- AC-7-01 ✅ Full item creation with all fields
- AC-7-02 ✅ New category creatable from dashboard or inline when adding item
- AC-7-03 ✅ All item types follow same tracking logic
- AC-7-04 ⬜ Item editing and archiving not yet implemented

### US-08: Designated buyer per item ✅
- AC-8-01 ✅ Default buyer field: specific member or "alternate each time"
- AC-8-02 ✅ Assigned buyer shown on item card
- AC-8-03 ⬜ Alternate rotation not yet implemented
- AC-8-04 ⬜ Manual reassignment UI not yet implemented

### US-02: Adaptive Usage Tracking ⬜
- AC-2-01 ⬜ Usage rate not recalculated from check-ins yet
- AC-2-02 ✅ Manual stock update via check-in
- AC-2-03 ⬜ Usage rate not surfaced in item detail view

### US-03 & US-04: Reminders & Notifications ⬜
- Dashboard reminders section shows warning/urgent items ✅
- Push notifications / Kakao / SMS not yet implemented ⬜

### US-05: Multi-user support ✅
- AC-5-01 ✅ Both users log in to same household
- AC-5-02 ✅ Realtime sync across members
- AC-5-03 ⬜ Notifications not yet implemented

---

## Open Items / Backlog

- [ ] Move items between categories (drag & drop or edit)
- [ ] Edit existing items (name, tracking mode, usage rate, etc.)
- [ ] Archive / delete items
- [ ] Alternate buyer rotation logic
- [ ] Push notifications (PWA) + Kakao Alimtalk / SMS
- [ ] Price history (last 3 purchases per item)
- [ ] Automated price fetching via Apify Coupang Scraper (V2)
- [ ] Adaptive usage rate refinement from check-in history
- [ ] Onboarding flow with category/pet name prompts

---

## Notes

- **Price Checking (V1)**: Manual — reminders include saved product URL; user taps through, checks price, confirms within 5% of last recorded price.
- **Price Checking (V2)**: Automated via Apify Coupang Scraper API (~$4/1k requests).
- **Notifications**: Kakao Alimtalk may require business account. SMS is fallback. PWA push covers mobile without native app.
- **Units**: Configurable per item (g, kg, pieces, bags, L, etc.).
