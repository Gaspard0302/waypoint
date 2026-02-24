# Waypoint — Product Requirements Document

**Version:** 1.2
**Date:** 2026-02-24
**Author:** Gaspard Hassenforder
**Status:** Active

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem & Solution](#2-problem--solution)
3. [Target Users](#3-target-users)
4. [How It Works — User Journey](#4-how-it-works--user-journey)
5. [Onboarding Flow — Dashboard UX](#5-onboarding-flow--dashboard-ux)
6. [Site Map Visualization](#6-site-map-visualization)
7. [Tech Stack — Decisions & Justifications](#7-tech-stack--decisions--justifications)
8. [System Architecture](#8-system-architecture)
9. [Project Structure](#9-project-structure)
10. [Database Schema](#10-database-schema)
11. [API Design](#11-api-design)
12. [Security Model](#12-security-model)
13. [Monetization Model](#13-monetization-model)
14. [Build Order — Phase by Phase](#14-build-order--phase-by-phase)
15. [Infrastructure & Hosting](#15-infrastructure--hosting)
16. [Open Questions & Future Work](#16-open-questions--future-work)

---

## 1. Product Vision

Waypoint is an **embeddable AI navigation agent** for websites. A developer adds one `<script>` tag to their site. Their visitors can then say "take me to the upgrade page" or "how do I reset my password?" — and Waypoint **does it for them**: it navigates, clicks, and guides the user through the UI.

This is not a chatbot. This is an agent that takes action.

**One-line pitch:** _"Intercom for doing, not telling."_

---

## 2. Problem & Solution

### The Problem

Users on complex websites get lost. They churn. Support tickets pile up. Every SaaS knows that "where do I find X?" is their #1 support query. Existing solutions:

- **Help docs / Intercom:** Text answers. User still has to navigate themselves.
- **Product tours (Appcues, Intercom Tours):** Pre-scripted, rigid, not conversational.
- **General AI browser agents (OpenAI Operator):** User-installed, not embeddable, not scoped.

### The Solution

Waypoint is the first **embeddable widget that takes UI actions**:

1. Developer installs a script tag once.
2. Waypoint pre-indexes their entire site (routes, buttons, links).
3. When a visitor asks a question, Waypoint navigates and clicks for them — in their own browser tab.

**Why this wins:**
- Scoped to host domain only (no security concerns).
- Uses a pre-built index from source code — no computer vision, low latency, fewer hallucinations.
- Works on any framework (React, Vue, Next.js, SvelteKit, Rails) — because it reads source, not rendered HTML.

---

## 3. Target Users

### Primary: Website Owners (B2B SaaS, Tools, E-commerce)

Anyone who runs a website with non-trivial navigation. Initial focus:

- **B2B SaaS founders** (e.g. a solo founder with a 20-page app who can't afford support)
- **Marketing sites with complex funnels** (e.g. documentation portals)
- **E-commerce with many categories** (e.g. help users find products)

### End Users (Visitors)

The actual chat widget users — visitors on the host site. They need zero setup. They just type.

### Personas

| Persona | Pain | How Waypoint Helps |
|---|---|---|
| SaaS founder | Support overwhelm, churn from confusion | Widget handles "where is X" queries 24/7 |
| E-commerce operator | Users abandon when they can't find products | Agent guides them to the right page |
| Developer/Agency | Clients need better UX without rebuilding | Drop-in widget, instant value |

---

## 4. How It Works — User Journey

### Developer (Site Owner)

```
1. Sign up on waypoint.ai → create a site → get an API key
2. Run one command shown on the dashboard:
     npx waypoint-init
   → CLI asks which coding agent they use (Claude Code / Mistral Vibe / Cursor)
   → Authenticates, writes credentials to .waypoint config (gitignored)
   → Downloads 3 skill files into their agent's skill directory
3. In their coding agent terminal, run:
     /waypoint-setup   ← orchestrator guides the rest
   → Prompts them to run /waypoint-index (maps the codebase)
   → Then prompts them to run /waypoint-install (embeds the widget)
4. Review the widget diff, commit and deploy
5. (Optional) Add /waypoint-index to CI/CD for auto-reindex on every deploy
```

### Visitor (End User)

```
1. Lands on the host site, sees a chat bubble (bottom-right)
2. Types: "How do I upgrade my plan?"
3. Waypoint agent looks up the index → finds "/billing > Upgrade button"
4. Widget executes: navigate to /billing, scroll to Upgrade, highlight button
5. User is exactly where they need to be
```

---

## 5. Onboarding Flow — Dashboard UX

The onboarding experience is the product's first impression and the primary conversion moment. It must go from "I just signed up" to "I can see my own website mapped out" in under 3 minutes.

### Step-by-Step Onboarding

The dashboard is minimal — it's the **launch pad**, not the wizard. The real onboarding happens in the developer's own coding agent terminal via the 3-skill guided flow.

```
Step 1: Sign Up (dashboard)
  ↓ Email + password (Supabase Auth)

Step 2: Create Your First Site (dashboard)
  ↓ Form: Site name + production URL
  ↓ API key generated automatically
  ↓ Dashboard shows one command to copy:
      npx waypoint-init

Step 3: CLI Setup (terminal)
  ↓ npx waypoint-init
  ↓ "Which coding agent do you use?" → Claude Code / Mistral Vibe / Cursor
  ↓ Authenticates (browser OAuth or paste API key)
  ↓ Writes credentials to .waypoint (auto-added to .gitignore)
  ↓ Downloads 3 skill files into agent's skill directory
  ↓ "Setup complete. Open your coding agent and run /waypoint-setup"

Step 4: Guided Skill Wizard (coding agent terminal)

  /waypoint-setup
  ↓ ✓ Found API key
  ↓ ✓ Detected Next.js App Router — 47 route files found
  ↓ Ready to map your codebase. Type /waypoint-index to continue.

  /waypoint-index
  ↓ Reads all route files and components
  ↓ Extracts routes, purposes, interactive elements
  ↓ POSTs structured index to Waypoint
  ↓ ✓ 47 routes indexed, 312 elements extracted
  ↓ Your site map is live at waypoint.ai/dashboard
  ↓ Ready to embed the widget. Type /waypoint-install to continue.

  /waypoint-install
  ↓ ✓ Detected layout.tsx at app/layout.tsx
  ↓ Adding WaypointWidget to root layout...
  ↓ ✓ Done — review the diff, commit and deploy when ready

Step 5: Site Map Reveal (dashboard, after /waypoint-index runs)
  ↓ Full interactive tree/map of their site appears live
  ↓ Each node = one route, with title + purpose + element count
  ↓ "This is the map your AI agent will use to navigate your site."

Step 6: CI/CD (optional, post-launch)
  ↓ Dashboard shows a one-liner for GitHub Actions / Vercel hooks
  ↓ Runs /waypoint-index automatically on every deploy
```

### UX Principles for Onboarding

- **Progressive reveal:** Don't show the full dashboard until onboarding is complete. Use a wizard/stepper UI.
- **Immediate value:** The site map reveal is the "aha moment." Every step before it should build anticipation.
- **Real-time feedback:** The indexing step shows a live counter/animation — never a static loading spinner. People should see it working.
- **No dead ends:** If crawling fails (site not reachable, JS-heavy SPA that needs time), show a clear message with one action to retry.

### Stepper Component Design

```
[1: Account] → [2: Add site + npx] → [3: /waypoint-setup] → [4: /waypoint-index] → [5: /waypoint-install]
```

Use Shadcn's `Stepper` component (or build a simple one). Each step is a full-page panel, not a modal. The wizard lives at `/onboarding`.

After onboarding completes, the user lands on the main dashboard where they can manage multiple sites.

---

## 6. Site Map Visualization

This is the product's hero feature in the dashboard. It serves two purposes:
1. **For the developer:** A visual audit of what Waypoint has learned about their site.
2. **For the system:** It IS the structured index the agent uses — display and data are the same thing.

### What It Shows

A **tree graph** where:
- Each **node** represents a unique page/route
- Each **edge** represents a navigable link between pages
- Nodes are organized by depth from the homepage (root)
- Each node displays:
  - Page route (e.g. `/pricing/upgrade`)
  - Page title (from component/route metadata)
  - Page purpose — a one-line description inferred by the skill from the source
  - Count of interactive elements found (e.g. "4 actions")
- Clicking a node expands a sidebar showing all interactive elements on that page

### Visual Structure Example

```
[ / (Home) ]
      |
   ┌──┴──────────────┐
   ▼                 ▼
[ /pricing ]      [ /docs ]
      |                |
   ┌──┴──┐         ┌───┴────┐
   ▼     ▼         ▼        ▼
[/upgrade] [/compare] [/quickstart] [/api-ref]
```

Nodes with many children show a collapsed "+N more" indicator to avoid visual clutter.

### Technology: React Flow

**Why React Flow?**
- The industry standard for node-based graph visualizations in React.
- Handles layout, zoom/pan, node rendering, edge routing out of the box.
- Supports custom node components (we'll add screenshot thumbnails inside nodes).
- Actively maintained, great docs, MIT license.
- `npm install @xyflow/react`

**Layout algorithm:** Use `dagre` (hierarchical top-down layout) via the `@dagrejs/dagre` package. This produces the tree-like top-to-bottom structure we want.

### Node Component Design

```tsx
// Conceptual structure of each node in the tree
<SiteMapNode>
  <div className="route">{route.path}</div>      // e.g. "/pricing"
  <div className="title">{route.title}</div>      // e.g. "Pricing – Waypoint"
  <div className="purpose">{route.purpose}</div>  // e.g. "Manage subscription and billing"
  <div className="badge">{elements.length} actions</div>
</SiteMapNode>
```

### Real-time Updates During Indexing

As the skill POSTs routes to the backend, the frontend shows them appearing live:
- Backend inserts rows into `site_index` as it receives them from the skill.
- Dashboard subscribes to changes on `site_index` table via **Supabase Realtime**.
- New nodes "pop in" to the tree as they arrive.
- No polling needed — Supabase Realtime handles the WebSocket connection.

---

## 7. Tech Stack — Decisions & Justifications

This stack was chosen for: **commercial viability, low operational cost, solo developer ergonomics, and production readiness**.

---

### Backend — Python + FastAPI

**Why FastAPI (not Django, not Flask)?**
- FastAPI is the current gold standard for Python APIs. Async-native, very fast.
- Auto-generates OpenAPI docs (great for debugging and future API consumers).
- Pydantic models for data validation — catch bugs at the boundary, not deep in your code.
- Django is overkill (built for server-rendered HTML pages, not APIs). Flask makes you build too much yourself.
- You know Python. Use your strength.

**Stack:**
- `fastapi` — API framework
- `uvicorn` — ASGI server (runs FastAPI)
- `pydantic` — data validation / settings
- `supabase-py` — database client
- `anthropic` — Claude API
- `python-dotenv` — environment variable management

---

### Database — Supabase (Postgres)

**Why Supabase?**
- Supabase = managed Postgres + built-in Auth + Storage + real-time subscriptions.
- Free tier: 500MB database, 50,000 monthly active users, 2GB file storage. More than enough to reach first 100 customers.
- Includes **Row Level Security (RLS)** — critical for multi-tenant apps (each site owner only sees their own data).
- Built-in auth means you don't have to build login from scratch.
- When you outgrow the free tier, scale is $25/month — very reasonable.
- **Alternative considered:** Raw Postgres on Railway. Rejected because Supabase includes auth, saves weeks of work.

---

### Dashboard (Web App) — Next.js + Tailwind + Shadcn/UI

**Why Next.js?**
- The industry standard for SaaS dashboards in 2026. Every SaaS you admire uses it.
- App Router (the modern version) gives you server-side rendering for free — faster pages, better SEO.
- Deployed instantly on Vercel (made by the same team) — push to GitHub, live in 30 seconds.
- **Alternative considered:** Pure Python with HTMX. Rejected because hiring, community support, and component ecosystems are far superior in Next.js.

**Why Shadcn/UI?**
- The best UI component library right now. Not a package you install — you copy-paste components directly into your codebase and own them.
- Built on Tailwind CSS — easy to customize, no fighting a design system.
- Looks professional immediately. Saves weeks of CSS work.
- **Starters to look at:** `create-t3-app`, or start with `npx create-next-app`.

**Stack:**
- `next` — framework
- `tailwindcss` — utility CSS
- `shadcn/ui` — component library
- `@xyflow/react` — site map tree visualization (React Flow)
- `@dagrejs/dagre` — automatic hierarchical tree layout for React Flow
- `@supabase/supabase-js` — auth + DB in browser
- `@supabase/ssr` — server-side Supabase helpers for Next.js

---

### Widget — Vanilla TypeScript (compiled to IIFE)

**Why NOT React/Vue for the widget?**
- The widget embeds on customer websites. Their site might use React 18, or React 16, or Vue, or nothing.
- If you ship a React bundle, you risk version conflicts that break their site.
- Vanilla TypeScript compiled to a single `.min.js` file = zero conflicts, works everywhere.
- File must be tiny (<50KB ideally) — users abandon sites that are slow.

**Build Tool: esbuild**
- Fastest JavaScript bundler. Compiles TypeScript instantly.
- Zero config for simple projects. Outputs a single file.
- **Alternative considered:** Webpack/Vite. Rejected — overkill for a single file bundle.

**Widget responsibilities:**
- Render the chat bubble
- Handle user input
- Connect to Waypoint backend (WebSocket or HTTP)
- Execute action payloads (navigate, click) in the user's browser

---

### LLM — Anthropic Claude API

**Why Claude?**
- Already specified in project vision. Claude has exceptional instruction-following, which is critical for parsing structured site indexes and returning precise action payloads.
- `claude-haiku-4-5` for production (cheapest, still very capable, low latency — ideal for real-time widget interactions).
- `claude-sonnet-4-6` for indexing/crawling analysis (higher quality, run offline, one-time per crawl).

**Cost estimate (free tier traffic):**
- 1,000 widget interactions/month @ ~500 tokens each = ~500K tokens = ~$0.04 (Haiku). Essentially free at MVP scale.

---

### Indexing — Skill File (Markdown)

**Why a skill instead of a headless crawler?**
- Source code is the ground truth: sees all routes (auth-gated, dynamic, orphan pages) — a crawler can only find what's linked.
- Richer semantic context: component names, prop labels, and JSDoc comments convey intent far better than scraped text.
- Zero server infrastructure: runs on the developer's machine via their existing agentic coding tool.
- Framework-aware: an AI agent reading Next.js App Router files understands the structure; a crawler just sees rendered HTML.
- No Playwright, no headless Chromium, no Browserbase costs.

**How it works:**
- The skill is a single `.md` file developers add to their project (`.claude/skills/waypoint-index.md` for Claude Code, compatible with Mistral Vibe and Cursor).
- When run, the agent: discovers route files → reads component trees → extracts labels, selectors, purposes → builds a JSON index → POSTs to `POST /api/v1/sites/{id}/index`.
- The skill explicitly instructs the agent to skip `.env` files, auth internals, API secrets, and private business logic.

**Re-indexing strategy:**
- Developer adds the skill run to their CI/CD pipeline (one line in GitHub Actions).
- No webhook needed — the index is always fresh from source.

---

### Hosting

| Component | Service | Cost |
|---|---|---|
| Backend (FastAPI) | Railway | Free ($5/month credit) |
| Dashboard (Next.js) | Vercel | Free tier |
| Database | Supabase | Free tier |
| Widget JS file | Vercel (static hosting) | Free |
| CLI (`npx waypoint-init`) | npm registry | Free |
| Indexing + installation | Developer's machine (skills) | Free |

**Total infra cost at MVP: ~$0/month.** No crawler infrastructure needed.

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER FLOW                           │
│                                                             │
│  Developer Terminal (their own machine)                     │
│    runs /waypoint-index skill                               │
│    → AI agent reads codebase source files                   │
│    → builds route+action JSON map                           │
│    → POSTs index to backend ─────────────────────────────┐  │
│                                                           │  │
│  Dashboard (Next.js on Vercel)                            │  │
│    → Sign up → Create site → Get API key → Copy script tag│  │
└───────────────────────────────────────────────────────────┼──┘
                                                            │ HTTPS
                                                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI on Railway)                   │
│                                                             │
│  /api/v1/sites/{id}/index  — Receive index from skill       │
│  /api/v1/sites             — CRUD for site configs          │
│  /api/v1/chat              — Widget sends messages here     │
│                                                             │
│  ┌──────────────┐    ┌────────────────┐                     │
│  │    Agent     │◀──▶│   Supabase DB  │                     │
│  │ (Claude API) │    │  (Postgres)    │                     │
│  └──────────────┘    └────────────────┘                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              VISITOR FLOW (End User)                        │
│                                                             │
│  Host Website (any site)                                    │
│    <script src="waypoint.min.js" data-key="..."></script>   │
│                                                             │
│  Widget (Vanilla TS) ─── sends user message ──▶ Backend     │
│                      ◀── receives action ───────            │
│                      ─── executes in browser ──▶ DOM        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Widget → Agent → Action

```
1. Visitor types "Take me to billing"
2. Widget sends: { message: "...", siteId: "...", sessionId: "..." }
3. Backend looks up site index from Supabase
4. Claude receives: { userMessage, siteIndex } → returns { action: "navigate", target: "/billing" }
5. Backend sends action to widget
6. Widget executes: window.location.href = "/billing"  (or router push for SPAs)
```

---

## 9. Project Structure

```
waypoint/
├── cli/                        # npx waypoint-init (Node.js)
│   ├── index.js                # Entry point — auth, config write, skill download
│   ├── package.json            # { "name": "waypoint", "bin": { "waypoint-init": "./index.js" } }
│   └── templates/              # Skill file templates (one per platform)
│       ├── waypoint-setup.md   # Orchestrator skill
│       ├── waypoint-index.md   # Indexer skill
│       └── waypoint-install.md # Integrator skill
│
├── skill/                      # Canonical skill source (platform-agnostic)
│   ├── waypoint-setup.md       # Orchestrator: guided wizard, prompts user to run next skill
│   ├── waypoint-index.md       # Indexer: reads source, builds + POSTs route+action map
│   ├── waypoint-install.md     # Integrator: embeds widget in framework-appropriate location
│   └── README.md               # How to install manually + CI/CD integration guide
│
├── backend/                    # Python FastAPI
│   ├── app/
│   │   ├── main.py             # FastAPI app, router registration
│   │   ├── config.py           # Pydantic settings (env vars)
│   │   ├── api/
│   │   │   ├── sites.py        # POST /sites, GET /sites/:id, etc.
│   │   │   ├── index.py        # POST /sites/{id}/index (receive skill output)
│   │   │   └── chat.py         # POST /chat (widget messages)
│   │   ├── agent/
│   │   │   ├── client.py       # Anthropic API calls
│   │   │   └── prompts.py      # System prompts for agent
│   │   └── db/
│   │       ├── client.py       # Supabase client singleton
│   │       └── queries.py      # DB query functions
│   ├── requirements.txt
│   └── .env.example
│
├── dashboard/                  # Next.js app (TypeScript)
│   ├── app/
│   │   ├── (auth)/             # Login, signup pages (route group)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── onboarding/         # Wizard shown after first signup
│   │   │   ├── page.tsx        # Step 1: Welcome
│   │   │   ├── site/page.tsx   # Step 2: Add site URL
│   │   │   ├── indexing/page.tsx # Step 3: Live crawl progress
│   │   │   ├── map/page.tsx    # Step 4: Site map reveal
│   │   │   └── install/page.tsx # Step 5: Script tag
│   │   ├── (dashboard)/        # Protected pages (post-onboarding)
│   │   │   ├── layout.tsx      # Dashboard shell (sidebar, nav)
│   │   │   ├── page.tsx        # Overview / home
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx    # List all sites
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Site overview
│   │   │   │       ├── map/page.tsx    # Full interactive site map
│   │   │   │       └── install/page.tsx # Script tag + webhook docs
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Shadcn components live here
│   │   ├── site-map/
│   │   │   ├── SiteMapFlow.tsx     # React Flow wrapper + dagre layout
│   │   │   └── SiteMapNode.tsx     # Custom node: screenshot + route + badge
│   │   ├── onboarding/
│   │   │   ├── StepIndicator.tsx   # Step 1/2/3/4/5 progress bar
│   │   │   └── CrawlProgress.tsx   # Live counter during indexing
│   │   └── sites/              # Site-specific components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   └── server.ts       # Server Supabase client
│   │   ├── site-map.ts         # Convert flat site_index rows → tree structure for React Flow
│   │   └── api.ts              # Typed fetch wrapper for backend
│   ├── middleware.ts            # Auth protection for dashboard routes
│   ├── package.json
│   └── .env.local.example
│
├── widget/                     # Vanilla TypeScript (embeddable)
│   ├── src/
│   │   ├── index.ts            # Entry point, auto-init on load
│   │   ├── ui.ts               # DOM: create chat bubble, message list
│   │   ├── api.ts              # HTTP calls to backend /chat
│   │   └── executor.ts         # Execute action payloads in browser
│   ├── build.js                # esbuild config
│   ├── package.json
│   └── tsconfig.json
│
├── CLAUDE.md
├── PRD.md                      # This document
└── README.md
```

---

## 10. Database Schema

All tables live in Supabase (Postgres). Row Level Security (RLS) is enabled on all tables.

### `users` (managed by Supabase Auth)
Supabase Auth handles users automatically. You don't create this table — you reference `auth.users`.

### `sites`
```sql
CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only see their own sites
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sites" ON sites
  FOR ALL USING (auth.uid() = user_id);
```

### `crawl_jobs`
```sql
CREATE TABLE crawl_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | running | done | failed
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `site_index`
One row per crawled route/page. The `parent_id` column captures the navigation tree structure — the same data used by the visualization and the agent.
```sql
CREATE TABLE site_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  crawl_job_id    UUID NOT NULL REFERENCES crawl_jobs(id),
  parent_id       UUID REFERENCES site_index(id),  -- null = root (homepage)
  path            TEXT NOT NULL,               -- e.g. "/pricing"
  title           TEXT,                         -- page <title>
  description     TEXT,                         -- meta description or summary
  screenshot_url  TEXT,                         -- Supabase Storage URL for thumbnail
  depth           INTEGER NOT NULL DEFAULT 0,  -- 0 = homepage, 1 = direct child, etc.
  elements        JSONB NOT NULL DEFAULT '[]',  -- array of interactive elements
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by site
CREATE INDEX idx_site_index_site_id ON site_index(site_id);
-- Index for tree traversal
CREATE INDEX idx_site_index_parent_id ON site_index(parent_id);
```

**Key design decision:** `parent_id` creates a self-referential tree. This is the same structure rendered in the site map visualization — no translation layer needed. The agent also uses this tree: it can understand that `/pricing/upgrade` is a child of `/pricing`, which helps it reason about navigation depth.

**`elements` JSONB structure:**
```json
[
  {
    "label": "Upgrade Plan",
    "selector": "[data-testid='upgrade-btn']",
    "aria_label": "Upgrade your plan",
    "element_type": "button",
    "action": "click",
    "context": "Located in the billing section header"
  },
  {
    "label": "Pricing page link",
    "selector": "a[href='/pricing']",
    "element_type": "link",
    "action": "navigate",
    "target": "/pricing"
  }
]
```

### `sessions`
One row per visitor widget session.
```sql
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id  TEXT,           -- anonymous fingerprint (no PII)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `messages`
```sql
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,  -- 'user' | 'assistant'
  content       TEXT NOT NULL,
  action_taken  JSONB,          -- the action payload executed, if any
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `plans` (for freemium/billing)
```sql
CREATE TABLE plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier        TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'business'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 11. API Design

All backend endpoints are under `/api/v1/`. JSON request/response throughout.

### Authentication

- **Dashboard → Backend:** JWT from Supabase Auth passed as `Authorization: Bearer <token>`.
- **Widget → Backend:** API key passed as `X-Waypoint-Key: <api_key>` header.
- All endpoints validate one of these two auth methods.

### Endpoints

#### Sites

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/sites` | JWT | Create a new site |
| `GET` | `/api/v1/sites` | JWT | List user's sites |
| `GET` | `/api/v1/sites/{id}` | JWT | Get site details |
| `DELETE` | `/api/v1/sites/{id}` | JWT | Delete site + all data |

#### Indexing

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/sites/{id}/index` | API Key | Skill POSTs the route+action map here |
| `GET` | `/api/v1/sites/{id}/index` | JWT | View the current index (dashboard) |
| `GET` | `/api/v1/sites/{id}/index/jobs` | JWT | List index job history |

#### Chat (Widget)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/chat` | API Key | Send a message, get action response |
| `POST` | `/api/v1/sessions` | API Key | Create a new visitor session |

**`POST /api/v1/chat` request:**
```json
{
  "session_id": "uuid",
  "message": "How do I upgrade my plan?"
}
```

**`POST /api/v1/chat` response:**
```json
{
  "reply": "I'll take you to the billing page right now.",
  "action": {
    "type": "navigate",
    "target": "/billing"
  }
}
```

**Action types:**
- `navigate` — change page: `{ type: "navigate", target: "/path" }`
- `click` — click an element: `{ type: "click", selector: "[aria-label='Upgrade']" }`
- `highlight` — highlight an element (future): `{ type: "highlight", selector: "..." }`
- `none` — text-only answer, no UI action

---

## 12. Security Model

Security is critical — Waypoint runs JavaScript on customer websites and has access to their users' browsing sessions.

### API Key Scoping
- Each site has a unique `api_key`.
- The widget sends this key with every request.
- Backend validates key AND checks that the request `Origin` header matches the site's registered URL.
- **This prevents key theft being useful** — your key only works from your domain.

### Domain Enforcement
- Crawler only stores routes within the registered `site.url` domain.
- Agent system prompt explicitly constrains actions to the registered domain.
- Widget JS refuses to execute `navigate` actions pointing outside the host domain.

### No Raw HTML to LLM
- The LLM never sees raw page HTML or user-entered content from the site.
- It only sees the pre-built structured index (labels, selectors, paths).
- This eliminates prompt injection via page content.

### No PII Storage
- Visitor sessions use an anonymous fingerprint (hash of IP + user agent, not stored directly).
- Message content is stored for debugging but contains no PII by default.
- Dashboard includes a "clear session data" option per site.

### Widget Sandboxing
- The widget script cannot modify `localStorage`, `cookies`, or intercept form data.
- The only actions available are `navigate`, `click`, and `highlight`.
- No arbitrary code execution — actions are an allowlist, not arbitrary eval().

### Rate Limiting
- `/api/v1/chat` is rate-limited per API key: 60 requests/minute, 1000 requests/day (free tier).
- Prevents abuse and runaway LLM costs.

---

## 13. Monetization Model

**Model: Freemium + monthly subscription (SaaS)**

### Tiers

| Feature | Free | Pro ($29/mo) | Business ($99/mo) |
|---|---|---|---|
| Sites | 1 | 5 | Unlimited |
| Pages indexed per site | 50 | 500 | 5,000 |
| Widget sessions/month | 500 | 10,000 | 100,000 |
| Custom branding (remove "Powered by Waypoint") | No | Yes | Yes |
| Deploy webhook | No | Yes | Yes |
| Analytics dashboard | Basic | Full | Full |
| Priority support | No | Email | Dedicated |

### Why this pricing?
- Free tier creates a viral loop: "Powered by Waypoint" badge on free sites = free distribution.
- $29/mo is impulse-buy territory for a founder. No procurement process needed.
- Business tier captures agencies embedding on multiple client sites.

### Billing Infrastructure
- **Stripe** for payments (industry standard, excellent docs).
- `stripe` Python package for backend.
- Stripe Customer Portal for self-serve plan management (no custom billing UI needed).
- Usage tracked in `plans` table, enforced on every API call.

---

## 14. Build Order — Phase by Phase

This is the critical section. Work in this order. Do not skip phases. Each phase produces something you can test and show to someone.

---

### Phase 0 — Foundation (Week 1)

**Goal:** Running project skeletons connected to each other. Nothing broken.

**Tasks:**
1. Create Supabase project → run the schema SQL → confirm tables exist
2. Create FastAPI project in `/backend` → one `GET /health` endpoint that returns `{ "ok": true }`
3. Create Next.js project in `/dashboard` → install Tailwind + Shadcn
4. Set up Supabase Auth in dashboard → email/password login works
5. Deploy backend to Railway → confirm `GET /health` returns 200 in production
6. Deploy dashboard to Vercel → confirm login page loads in production
7. Set up environment variables on both platforms

**Deliverable:** You can sign up, log in, and the dashboard loads a blank page. Backend health check passes.

---

### Phase 1 — Site Management (Week 2)

**Goal:** A logged-in user can add a site and see it listed.

**Tasks:**
1. Backend: `POST /sites`, `GET /sites` endpoints
2. Backend: API key generation on site creation
3. Dashboard: "Add site" form → calls backend → shows in list
4. Dashboard: Site detail page (just URL + API key shown for now)

**Deliverable:** You can create a site, see it in the dashboard, and copy your API key.

---

### Phase 2 — Skill + Site Map (Weeks 3–4)

**Goal:** Developer runs the Waypoint skill in their codebase, the backend receives the index, and the dashboard shows a live-updating tree visualization.

**Tasks:**

**CLI (`cli/`):**
1. Write `cli/index.js` — a Node.js script publishable via `npx waypoint-init`:
   - Asks which coding agent (Claude Code / Mistral Vibe / Cursor)
   - Authenticates: open browser to `waypoint.ai/cli-auth?token=xxx` or prompt for API key paste
   - Writes `.waypoint` config file: `{ apiKey, siteId, agentType }`
   - Appends `.waypoint` to `.gitignore`
   - Copies the 3 skill files from `cli/templates/` into the right directory:
     - Claude Code → `.claude/skills/`
     - Mistral Vibe → project root as `SKILL.md` variants
     - Cursor → `.cursor/skills/`
   - Prints success message: "Open your coding agent and run /waypoint-setup"
2. Publish to npm so `npx waypoint-init` works without install

**Skill files (`skill/`):**
3. Write `waypoint-setup.md` (orchestrator):
   - Checks for `.waypoint` config, reads `apiKey` and `siteId`
   - Detects framework from `package.json` / file structure
   - Counts route files and reports
   - Ends with explicit prompt: "Type /waypoint-index to continue"
4. Write `waypoint-index.md` (indexer):
   - Discovers all route files (Next.js `app/`, `pages/`, React Router, Vue Router, etc.)
   - For each route: extract path, title, infer purpose from component name + headings
   - Find interactive elements: buttons, links, forms — label, ARIA attrs, selector, action type
   - Skip: `.env*`, auth middleware, private API handlers, DB schemas
   - Build JSON array → POST to `/api/v1/sites/{siteId}/index` using key from `.waypoint`
   - Ends with explicit prompt: "Type /waypoint-install to continue"
5. Write `waypoint-install.md` (integrator):
   - Detects framework and entry point (Next.js `app/layout.tsx`, Vue `App.vue`, plain HTML)
   - Adds `<WaypointWidget apiKey="..." />` or `<script>` tag in the right place
   - Instructs agent to show the diff before writing
6. Test all 3 skills on this repo and at least one Next.js demo project

**Backend (index endpoint):**
4. Write `api/index.py`:
   - `POST /api/v1/sites/{id}/index` — accepts JSON body: array of route objects
   - Validates API key (same key used by widget)
   - Creates a new `index_job` row (status = running)
   - Upserts each route into `site_index` table (insert or update by path)
   - Marks job as complete when all routes are stored
5. `GET /api/v1/sites/{id}/index` — returns current index for dashboard
6. `GET /api/v1/sites/{id}/index/jobs` — job history

**Dashboard (site map):**
7. Install React Flow + dagre: `npm install @xyflow/react @dagrejs/dagre`
8. Subscribe to `site_index` table via Supabase Realtime — new rows trigger UI update
9. Build `SiteMapNode` component: shows route path + title + purpose + element count badge
10. Build `SiteMapFlow` component: uses dagre to layout nodes top-to-bottom, renders with React Flow
11. Dashboard site detail page: full site map with zoom/pan
12. Dashboard shows `npx waypoint-init` command prominently when no index exists yet

**Deliverable:** Developer runs `npx waypoint-init`, follows the guided skill wizard (`/waypoint-setup` → `/waypoint-index` → `/waypoint-install`), watches their site map build in real-time on the dashboard, and ends with the widget embedded in their codebase — ready to commit.

---

### Phase 3 — Agent (Week 5)

**Goal:** The backend can receive a message + site context and return an action.

**Tasks:**
1. Install Anthropic SDK in backend
2. Write `agent/prompts.py` — system prompt that explains the index format and expected output format
3. Write `agent/client.py` — takes (message, site_index) → calls Claude → parses action from response
4. Backend: `POST /sessions` → creates session row
5. Backend: `POST /chat` → validates API key → fetches index → calls agent → saves messages → returns response

**Prompt design (critical):**
```
You are a website navigation assistant for {site_name}.
You help visitors navigate the site by taking actions.

Available routes and elements:
{site_index_json}

When the user asks where to go or how to do something, respond with:
1. A short friendly message (max 2 sentences)
2. One action from this list:
   - { "type": "navigate", "target": "/path" }
   - { "type": "click", "selector": "css-selector" }
   - { "type": "none" } (for questions you answer with text only)

Never suggest navigating outside the domain {site_domain}.
Return your response as JSON: { "reply": "...", "action": {...} }
```

**Deliverable:** You can `curl -X POST /api/v1/chat` with a test message and get back a valid action response.

---

### Phase 4 — Widget (Weeks 6–7)

**Goal:** A working chat bubble that takes action on your demo site.

**Tasks:**
1. Set up widget build with esbuild
2. Write `ui.ts` — create chat bubble DOM, message list, input box
3. Write `api.ts` — POST to `/api/v1/chat`, handle response
4. Write `executor.ts` — execute action payloads:
   - `navigate`: try `window.history.pushState` first (SPA), fall back to `window.location.href`
   - `click`: `document.querySelector(selector)?.click()` with error handling
5. Write `index.ts` — auto-init on load, read `data-key` from script tag
6. Build widget → upload to Vercel static hosting
7. Create demo HTML page, add script tag, test full flow end-to-end

**Script tag format:**
```html
<script
  src="https://widget.waypoint.ai/waypoint.min.js"
  data-key="your-api-key-here"
  async
></script>
```

**Deliverable:** You can add the script tag to any static HTML page, type a message, and the widget navigates the page.

---

### Phase 5 — Dashboard Install Page & Webhook (Week 8)

**Goal:** A developer can install Waypoint and set up auto-reindexing from the dashboard.

**Tasks:**
1. Dashboard: "Install" tab on each site page — shows:
   - The script tag with their API key pre-filled (copy button)
   - Webhook URL with instructions for Vercel/Netlify/GitHub Actions
2. Backend: `POST /reindex` endpoint — validates API key → triggers crawl job
3. Dashboard: Basic analytics stub (session count, message count)

**Deliverable:** Everything a developer needs to go from sign-up to installed widget is in the dashboard.

---

### Phase 6 — Polish & MVP Launch (Week 9)

**Goal:** Something you're not embarrassed to show. One thing working perfectly is better than everything half-working.

**Tasks:**
1. Error handling everywhere (crawler failures, API errors, widget network errors)
2. Loading states in dashboard
3. Widget UI polish (typing indicator, error state, mobile-friendly)
4. Add "Powered by Waypoint" badge on free tier
5. Set up Railway health checks and Vercel monitoring
6. Create your own demo site, install Waypoint, record a 60-second demo video
7. Ship to 5 people you know who run websites. Get feedback.

---

### Phase 7 — Billing (Week 10–11, after validation)

Do not build this until you have users who want to pay. Fake it first (manual invoice via Stripe link).

**Tasks:**
1. Add Stripe to backend
2. Upgrade/downgrade webhooks update `plans` table
3. Enforce limits on API calls based on plan tier
4. Dashboard: Billing page with Stripe Customer Portal link

---

## 15. Infrastructure & Hosting

### Local Development

```
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Dashboard
cd dashboard
npm run dev   # runs on localhost:3000

# Terminal 3: Widget (watch mode)
cd widget
npm run dev   # esbuild watch, rebuilds on save

# Indexing (run once in a test project to populate the index):
# → copy skill/waypoint-index.md into .claude/skills/ of any project
# → run /waypoint-index in that project's terminal
# → the skill will POST to http://localhost:8000
```

Use a `.env` file in each project for local environment variables. Never commit `.env` files.

### Production

| What | Where | Why |
|---|---|---|
| Backend API | Railway | Easy Python deployment, free tier, env var management |
| Dashboard | Vercel | Zero-config Next.js deployment, free tier |
| Widget JS | Vercel (static) | CDN-delivered, fast, free |
| Database | Supabase | Managed Postgres + Auth, free tier |
| Crawler (runs in backend) | Railway | Same service as API |

### Environment Variables

**Backend (`.env`):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx    # Never expose to frontend
ANTHROPIC_API_KEY=xxx
ENVIRONMENT=development
```

**Dashboard (`.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx    # Safe to expose (RLS protects data)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

---

## 16. Open Questions & Future Work

### Open Questions (Decide Before Building)

| Question | Options | Recommendation |
|---|---|---|
| Skill distribution | Docs page copy-paste vs. npm package vs. dashboard download | Dashboard download (one click, pre-filled with API key) |
| Non-developer customers | Require agentic tool vs. provide a CLI fallback | Agentic tool for MVP; add fallback CLI script later |
| SPA navigation in widget | History API vs. custom router hooks | Try history API first, add per-framework workarounds later |
| Widget delivery | Self-host on Vercel vs. CDN like Cloudflare | Vercel static is fine until 10K+ sites |
| Re-index trigger | Manual only vs. CI integration | Manual for MVP; CI guide in docs |
| Multi-platform skill | One file vs. platform-specific versions | One file (markdown instructions are universal) |

### Deferred Features (Post-MVP)

1. **UI highlighting** — draw an animated border around target elements
2. **Form pre-filling** — agent fills in form fields, not just navigates
3. **Auth-gated page indexing** — skill logs in and indexes pages behind auth
4. **Multi-step flows** — agent executes a sequence of actions, not just one
5. **Analytics** — heatmap of what visitors ask, which actions succeed/fail
6. **White-label** — remove all Waypoint branding for agencies
7. **Vector search over index** — for large sites with hundreds of pages
8. **Fallback CLI script** — for teams not using agentic coding tools (runs a Node/Python script that does the same analysis without an AI agent)
9. **Skill for non-Next.js frameworks** — specialized skill variants for Rails, Django, Laravel

### Key Risks

| Risk | Mitigation |
|---|---|
| Developer doesn't use an agentic coding tool | Provide a fallback CLI script (Phase 7+); target developers who do use these tools first |
| Skill generates incorrect selectors (source ≠ runtime DOM) | Validate selectors at widget runtime; fallback to navigate-only action |
| Widget breaks host site CSS | Scope all CSS with a unique prefix, use Shadow DOM for isolation |
| Customers churn before re-running skill | Email reminder if index hasn't been updated in 30 days; CI integration guide |
| Big Tech browser agents commoditize product | Focus on "owner-controlled, branded experience" — that's the moat |
| Skill leaks private info from source | Skill instructions explicitly exclude sensitive files; no raw source is sent to Waypoint — only the structured map |

---

## Appendix: Day One Checklist

Before writing any code, complete these:

- [ ] Create Supabase project at supabase.com
- [ ] Create Railway account at railway.app
- [ ] Create Vercel account at vercel.com
- [ ] Create Anthropic account at console.anthropic.com, get API key
- [ ] Create GitHub repo (monorepo — single repo, three folders: backend, dashboard, widget)
- [ ] Link GitHub repo to Vercel (for dashboard auto-deploy)
- [ ] Link GitHub repo to Railway (for backend auto-deploy)
- [ ] Run Supabase schema SQL (from Section 8 of this PRD)
- [ ] Set up environment variables on Railway and Vercel

---

*This PRD is a living document. Update it as decisions are made and requirements change.*
