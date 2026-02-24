# Waypoint — Project Context

## What Is This?

Waypoint is an embeddable AI website navigation agent. Website owners (developers, product teams) add a single `<script>` tag to their site. Their visitors can then ask in natural language — "how do I upgrade my plan?", "where do I change my password?" — and the agent **takes action on the UI** for them: navigating to the right page, clicking the right button.

This is not a Q&A chatbot. The key differentiator is **action**: the agent does things in the browser, not just answers in text.

---

## The Core Insight

> Existing embeddable chatbots (Intercom, Drift, Voiceflow) are limited to text responses.
> General browser agents (OpenAI Operator, Google Mariner) are user-installed, not embeddable by website owners.
> The gap: an embeddable widget that takes UI actions, scoped to the host website only.

---

## How It Works (Architecture)

### 1. Onboarding (Developer)
- Developer signs up on waypoint.ai → creates a site → gets an API key
- Dashboard shows one command: `npx waypoint-init`
- The CLI asks which coding agent they use (Claude Code / Mistral Vibe / Cursor), then:
  - Authenticates (opens browser OAuth or prompts for API key paste)
  - Writes credentials to `.waypoint` config file (added to `.gitignore` automatically — key never goes in a skill file)
  - Downloads the 3 skill files into the right directory for their chosen agent
- From there, everything happens through the guided skill wizard in their coding agent terminal

### 2. Indexing + Installation (3-skill system)

Three skill files are installed by `npx waypoint-init`. They work as a guided wizard:

**`/waypoint-setup` (Orchestrator — run once)**
- Entry point for new users
- Checks credentials are configured, detects the framework, confirms the project
- Does not do the work itself — it guides the user step by step, explicitly telling them to run the next skill at each checkpoint:
  ```
  ✓ Found API key
  ✓ Detected Next.js App Router (47 route files)
  Ready to map your codebase. Type /waypoint-index to continue.
  ```
- After `/waypoint-index` completes, it resumes and prompts for `/waypoint-install`
- This "tell the user which skill to run next" pattern avoids the limitation that skills can't call each other natively

**`/waypoint-index` (Indexer — run on every deploy)**
- Read-only analysis of the codebase
- Discovers all routes, extracts page titles, infers purpose, finds interactive elements (buttons, links, forms) with selectors
- Skips `.env`, auth middleware, private API handlers, secrets
- POSTs structured JSON to `POST /api/v1/sites/{id}/index`
- Safe to add to CI/CD (reads credentials from `.waypoint` config)

**`/waypoint-install` (Integrator — run once)**
- Modifies the codebase to embed the widget
- Detects framework and injects in the right place (Next.js `layout.tsx`, Vue `App.vue`, plain HTML `<body>`)
- User reviews the diff before committing — this is deliberate, not automatic

**Why this beats external crawling:**
- Sees ALL routes — including auth-gated pages, orphan pages, dynamic routes never linked from homepage
- Source code reveals intent: component names and prop labels are more meaningful than scraped text
- Zero infrastructure cost — no headless browser, no Playwright, no Browserbase
- Works instantly on any framework — Next.js, Vue, SvelteKit, Rails, anything

### 3. Widget (Client-Side Script)
- Renders a chat bubble on the host website
- Connects to Waypoint backend via WebSocket or HTTP
- When backend decides on an action, the script executes it in the user's browser:
  - Navigate: `window.location.href = '/pricing'` or SPA router push
  - Click: `document.querySelector('[aria-label="Upgrade plan"]').click()`
- **Scoped to host site only** — agent cannot navigate outside the host domain (security + trust)

### 4. Agent (Backend)
- Receives user message
- Looks up the pre-built index for the host site
- LLM (Claude) reasons over the structured route/action map
- Returns action instruction to the widget script
- No real-time computer vision needed — uses the index, not screenshots

---

## MVP Scope

- [ ] Dashboard: sign up, create site, get API key
- [ ] `npx waypoint-init` CLI: authenticates, writes `.waypoint` config, downloads skill files for chosen agent
- [ ] 3 skill files: `/waypoint-setup` (orchestrator), `/waypoint-index` (indexer), `/waypoint-install` (integrator)
- [ ] Backend: `POST /api/v1/sites/{id}/index` accepts skill JSON output
- [ ] Site map visualization: interactive tree in dashboard, live via Supabase Realtime
- [ ] Widget: chat bubble, HTTP connection to backend
- [ ] Agent: LLM over structured index, returns navigation/click actions
- [ ] Widget executes actions in browser

**NOT in MVP:**
- UI highlighting / element annotation (deferred — action-only for now)
- Form pre-filling with user data
- Screenshots / thumbnail previews in site map
- Multi-language support

---

## Key Technical Decisions

### Developer onboarding (CLI + skills)
- `npx waypoint-init` is the single entry point after sign-up — no dashboard wizard needed
- CLI writes credentials to `.waypoint` config (never embedded in skill files — prevents git leaks)
- `.waypoint` is added to `.gitignore` automatically
- 3 skills are downloaded into the agent's skill directory (`.claude/skills/` for Claude Code, etc.)
- The orchestrator (`/waypoint-setup`) guides the user through `/waypoint-index` then `/waypoint-install` via explicit "now run this skill" prompts — avoids the limitation of skills not being able to call each other natively

### Indexing approach
- `/waypoint-index` skill instructs the AI coding agent to read source files directly — no external crawler
- Extracts routes, page titles, interactive element labels and selectors from components — not from rendered HTML
- Explicitly skips `.env`, auth internals, secrets, private business logic
- Result: a structured JSON graph POSTed to Waypoint API: `{ route: '/pricing', title: '...', purpose: '...', elements: [{ label: 'Upgrade', selector: '...', action: 'click' }] }`
- Compatible with all frameworks: Next.js App/Pages Router, React Router, Vue Router, SvelteKit, etc.

### Action execution
- Widget script receives action payloads from backend
- Executes them directly in the page context
- Handles SPA navigation (intercept history API, not just `window.location`)
- Must handle: React Router, Next.js router, Vue Router

### Re-indexing
- Primary: developer adds `waypoint-index` skill run to their CI/CD pipeline (GitHub Actions, Vercel build hooks, etc.)
- Secondary: manual re-run of the skill in terminal (dashboard shows the command)
- The index is always generated from source — never stale due to a crawl missing a page

### Security
- Agent is scoped to host domain only (enforced server-side on the index, and client-side)
- No credential storage for end-users
- Script tag auth via API key (per-site key, rotatable)
- Prompt injection risk noted — mitigate by not passing raw page content to LLM, only structured index

---

## Competitive Landscape

| Product | Embeddable? | Takes UI actions? | Source-indexed? |
|---|---|---|---|
| Intercom / Drift | Yes | No (text only) | No |
| OpenAI Operator | No (user-installed) | Yes | No (vision) |
| Google Mariner | No (browser-native) | Yes | No (vision) |
| C3 AI Agentic Websites | Yes | Mostly Q&A | No |
| Voiceflow | Yes | No (text only) | No |
| **Waypoint** | **Yes** | **Yes** | **Yes (from source)** |

---

## Market Context

- Agentic browser market: ~$4.5B (2024) → projected $76.8B by 2034
- Adobe Analytics: 4,700% YoY increase in AI agent traffic to websites (2025)
- Big Tech browser-native agents (Chrome Auto Browse, Jan 2026) are the primary long-term risk
- Waypoint's defense: website owners want a **controlled, scoped, branded** agent — not a generic browser assistant

---

## Tech Stack (Proposed)

- **Backend:** Python + FastAPI
- **CLI:** Node.js (`npx waypoint-init`) — authenticates, writes `.waypoint` config, downloads skill files
- **Skills:** 3 markdown skill files (`/waypoint-setup`, `/waypoint-index`, `/waypoint-install`) — runs via Claude Code / Mistral Vibe / Cursor in developer's codebase
- **LLM:** Anthropic Claude API (claude-sonnet-4-6 or claude-haiku-4-5 for cost)
- **DB:** Supabase (Postgres + Auth + Realtime)
- **Widget:** Vanilla JS (no framework dependency — must embed on any site)
- **Infra:** Vercel (dashboard) + Railway (backend API)

---

## Open Questions

1. Pricing model: per-site flat fee, per-session, or per-action?
2. How to handle non-developer customers who don't use agentic coding tools? (Fallback: standalone Node script)
3. White-label option for agencies embedding on client sites?
4. Should the 3 skill files be platform-specific (separate for Claude Code / Vibe / Cursor) or one universal file? (Probably universal markdown with minor platform notes)
5. CI integration: should `/waypoint-index` auto-detect CI environment and skip the interactive prompts?
