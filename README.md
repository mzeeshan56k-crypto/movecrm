# MoveCRM — Multi-Company SaaS CRM for Moving Companies

A complete **SaaS** CRM for moving companies modeled on SmartMoving: any company can
self-sign-up and gets its own private, isolated workspace — sales pipeline, estimating,
dispatch, crew & truck management, billing, tasks, and reporting. Full backend
(Node.js + Express + **PostgreSQL**) and frontend (React + Vite).

> **To put it online for real, see [`DEPLOY.md`](./DEPLOY.md)** — a non-technical,
> click-by-click guide using Vercel + Supabase (100% free).

## SaaS architecture

- **Multi-tenant:** every company is an `organization`; every row of data carries an
  `org_id` and every query is scoped to the logged-in user's org, so companies can never
  see each other's data.
- **Self-serve signup:** `/signup` creates a new organization + its first admin, then
  auto-provisions that company's default lead sources, move sizes, service catalog, and
  email templates. New companies can one-click load sample data to explore.
- **JWT auth** carries the org; roles are admin / salesperson / dispatcher / crew.
- **PostgreSQL** for permanent, production-grade storage.
- **Automatic lead capture:** every company gets an unguessable public key powering
  a hosted "Get a Quote" page (`/quote/<key>`), an embeddable iframe form, a JSON
  webhook (`POST /api/public/lead/<key>`) for Zapier/lead providers, and Twilio
  voice webhooks (`POST /api/public/voice/<key>`) that answer inbound calls, record
  them, and auto-create leads with the recording attached.
- **Deployable two ways:** classic single server (`server/src/index.js`) or
  serverless on Vercel (`api/index.js` + `vercel.json`), schema auto-migrates on boot.

## Features

| Module | What it does |
|---|---|
| **Dashboard** | KPIs (new leads, bookings, moves today, cash collected, outstanding balance, conversion rate), upcoming moves, revenue chart, open tasks, activity feed |
| **Sales Pipeline** | Kanban board (Lead → Opportunity → Booked → In Progress) with drag-and-drop stage changes |
| **Jobs** | Full job management: move details, origin/destination, move size, type (local / long distance / commercial / storage / labor-only), status history |
| **Estimating** | Line-item quote builder with a configurable service catalog (hourly / flat / per-unit rates), auto-totaling |
| **Inventory** | Room-by-room item list with cubic-feet totals |
| **Calendar** | Month view of all scheduled moves, color-coded by status |
| **Dispatch** | Day board showing every job with crew/truck assignments and real-time crew & truck availability |
| **Crew & Trucks** | Manage movers (foreman / driver / mover, wages) and fleet (capacity, status) |
| **Billing** | Invoices generated from estimates (tax + discount), payment recording (card / cash / check / ACH), automatic paid/partial status, outstanding-balance tracking |
| **Customers** | Searchable customer database with job history, lifetime value, and full activity timeline |
| **Lead capture** | Hosted quote form + embed code + webhook per company — website inquiries, Zapier/lead-provider posts, and phone calls become leads automatically |
| **Calls** | Inbound calls answered & recorded via Twilio, logged with audio player, auto-matched to customers; manual call logging too |
| **Analytics** | Period-over-period comparisons (inquiries, bookings, value, cash), sales funnel, revenue by move type, busiest days, top customers |
| **Reviews** | Automated review gathering — completing a job auto-sends a review request; a public star-rating page routes 4★/5★ to Google and captures lower ratings privately (reputation gating, ReviewGather-style) |
| **Plans & Billing** | 14-day trial → Starter $100/mo (1 website), Growth $200/mo (5), Pro $400/mo (15), Enterprise (contact sales); per-plan limits enforced; Stripe checkout & billing portal (optional env keys); platform owner (OWNER_EMAIL) gets unlimited free access |
| **Multi-website** | Each company can run multiple lead-capture websites/locations, each with its own form, embed, and webhook (gated by plan) |
| **Tasks** | Follow-up tasks with due dates and assignees, per-job or global |
| **Activity log** | Notes, calls, emails, SMS, and automatic system events on every job |
| **Reports** | Revenue by month, lead-source ROI, salesperson performance, lost-reason analysis, cash collected |
| **Settings** | Company profile, lead sources, move sizes, service catalog/tariff, users & roles, email templates |
| **Auth & roles** | JWT login; admin / salesperson / dispatcher / crew roles (admin-only settings) |

## Run it online (recommended)

Follow **[`DEPLOY.md`](./DEPLOY.md)** — no coding, ~10 minutes, free to start. That's the
intended way to use this as a product.

## Run it locally (for developers)

Requires a local PostgreSQL database.

```bash
# 0. Have Postgres running and create a database named "movecrm"
export DATABASE_URL="postgresql://postgres@localhost:5432/movecrm"

# 1. Backend
cd server
npm install
npm run migrate       # creates the tables
npm run seed          # optional: a demo company you can log into immediately
npm start             # http://localhost:4000

# 2. Frontend (dev mode, another terminal)
cd client
npm install
npm run dev           # http://localhost:5173 (proxies /api to :4000)
```

Then open the app and **click "Create your company account"** to sign up — or use the
demo company the seed created:

| Email | Password | Role |
|---|---|---|
| admin@movecrm.test | admin123 | Admin |
| sara@movecrm.test | sales123 | Salesperson |
| dan@movecrm.test | dispatch123 | Dispatcher |

**Production build** (single server serves API + frontend):

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm run migrate && npm start
```

## Configuration

Environment variables:

- `DATABASE_URL` — PostgreSQL connection string **(required)**
- `JWT_SECRET` — secret for signing logins **(set this in production)**
- `PORT` — server port (default `4000`)
- `FORCE_SEED=1 npm run seed` — recreate the demo company

## Architecture

```
movecrm/  (repository root)
├── server/                 # Express REST API (PostgreSQL)
│   └── src/
│       ├── index.js        # app entry, serves client/dist in production
│       ├── db.js           # pg pool + query helpers
│       ├── migrate.js      # multi-tenant schema (run on deploy)
│       ├── provision.js    # per-company default config + sample data
│       ├── seed.js         # optional demo company
│       ├── auth.js         # JWT (carries org_id) + role middleware
│       └── routes/         # auth (signup/login), account, jobs, customers,
│                           # resources, billing, reports, settings
└── client/                 # React SPA (Vite)
    └── src/
        ├── pages/          # Login, Signup, Dashboard, Pipeline, Jobs, JobDetail,
        │                   # Calendar, Dispatch, Customers, Invoices, Tasks, Reports, Settings
        ├── components/     # Layout, modals, shared UI
        └── lib/            # API client + auth context
```

## Roadmap

- **Subscription billing** — charge companies to use the product (Stripe subscriptions,
  free trials, plans). The org model already has a `plan` field ready for this.
- Online payment processing (Stripe) and e-sign for estimates
- Customer-facing portal (view quote, confirm booking, pay deposit)
- Email/SMS sending (Resend / Twilio) using the built-in templates
- Crew mobile view with day schedule and job checklists
- Storage unit management & recurring storage billing
