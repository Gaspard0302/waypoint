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
- Developer signs up, enters their site URL + optional context (product description, key flows)
- Optional: credentials for auth-gated pages
- Triggers initial crawl from dashboard
- Copies a `<script>` tag into their codebase

### 2. Indexing (Backend)
- Backend crawler (headless browser — Playwright/Stagehand) crawls the site
- Builds a **route + action map**: every page, every meaningful interactive element (buttons, links, forms), their purpose, their selectors/ARIA labels
- Stores as a structured graph (not raw screenshots — structured, small context = fewer hallucinations)
- Re-indexing triggered automatically via **deploy webhook** (Option A):
  ```
  POST https://waypoint.ai/reindex?key=<api-key>
  ```
  Developer adds this to their Vercel/Netlify/GitHub Actions deploy pipeline.
- Manual "Re-index now" button available in dashboard as fallback

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

- [ ] Dashboard: sign up, enter URL, trigger crawl, copy script tag
- [ ] Backend crawler: Playwright-based, builds route+action map, stores in DB
- [ ] Deploy webhook endpoint (`POST /reindex`)
- [ ] Widget: chat bubble, WebSocket connection to backend
- [ ] Agent: LLM over structured index, returns navigation/click actions
- [ ] Widget executes actions in browser

**NOT in MVP:**
- UI highlighting / element annotation (deferred — action-only for now)
- Form pre-filling with user data
- Auth-gated page crawling (optional enhancement)
- Multi-language support

---

## Key Technical Decisions

### Indexing approach
- Use Playwright (headless browser) — handles SPAs, React, Vue, dynamic content
- Parse **accessibility tree** as primary representation (stable, compact, semantic)
- Fall back to DOM selectors for elements missing ARIA labels
- Store as JSON graph: `{ route: '/pricing', elements: [{ label: 'Upgrade', selector: '...', action: 'click' }] }`

### Action execution
- Widget script receives action payloads from backend
- Executes them directly in the page context
- Handles SPA navigation (intercept history API, not just `window.location`)
- Must handle: React Router, Next.js router, Vue Router

### Re-indexing
- Primary: deploy webhook (most reliable, fires on every deploy)
- Secondary: manual trigger in dashboard
- Future: client script reports DOM change signals as users browse

### Security
- Agent is scoped to host domain only (enforced server-side on the index, and client-side)
- No credential storage for end-users
- Script tag auth via API key (per-site key, rotatable)
- Prompt injection risk noted — mitigate by not passing raw page content to LLM, only structured index

---

## Competitive Landscape

| Product | Embeddable? | Takes UI actions? | Pre-indexed? |
|---|---|---|---|
| Intercom / Drift | Yes | No (text only) | No |
| OpenAI Operator | No (user-installed) | Yes | No (vision) |
| Google Mariner | No (browser-native) | Yes | No (vision) |
| C3 AI Agentic Websites | Yes | Mostly Q&A | No |
| Voiceflow | Yes | No (text only) | No |
| **Waypoint** | **Yes** | **Yes** | **Yes** |

---

## Market Context

- Agentic browser market: ~$4.5B (2024) → projected $76.8B by 2034
- Adobe Analytics: 4,700% YoY increase in AI agent traffic to websites (2025)
- Big Tech browser-native agents (Chrome Auto Browse, Jan 2026) are the primary long-term risk
- Waypoint's defense: website owners want a **controlled, scoped, branded** agent — not a generic browser assistant

---

## Tech Stack (Proposed)

- **Backend:** Node.js / TypeScript (or Python)
- **Crawler:** Playwright + Stagehand (TypeScript)
- **LLM:** Anthropic Claude API (claude-sonnet-4-6 or claude-haiku-4-5 for cost)
- **DB:** Postgres (site configs, indexes) + vector store (optional, for semantic search over index)
- **Widget:** Vanilla JS (no framework dependency — must embed on any site)
- **Infra:** Vercel / Railway for backend, Browserbase or self-hosted for crawlers

---

## Open Questions

1. Pricing model: per-site flat fee, per-session, or per-action?
2. How to handle sites that change frequently (e.g. marketing landing pages vs. stable SaaS apps)?
3. White-label option for agencies embedding on client sites?
4. How to crawl auth-gated pages cleanly without storing plaintext credentials?
