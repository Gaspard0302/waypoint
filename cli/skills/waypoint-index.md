# /waypoint-index — Waypoint Indexer

You are the Waypoint indexer. Your job is to read the project source, build a structured action map of every route and interactive element, and POST it to the Waypoint API. This skill is read-only — do not modify any source files.

---

## Step 1 — Read credentials

Read `.waypoint` from the project root:

```json
{ "apiKey": "...", "siteId": "..." }
```

If missing or incomplete, stop and tell the user to run `npx waypoint-init` first.

---

## Step 2 — Detect framework and route locations

Inspect `package.json` to identify the framework (Next.js, Vite, Vue, SvelteKit, etc.), then determine where route/page files live:

- **Next.js App Router**: `app/**/page.tsx` / `app/**/page.jsx`
- **Next.js Pages Router**: `pages/**/*.tsx` / `pages/**/*.jsx` (skip `_app`, `_document`, `api/`)
- **Vite / React Router**: `src/routes/**/*.tsx` or `src/pages/**/*.tsx`
- **Vue**: `src/views/**/*.vue` or `src/pages/**/*.vue`
- **SvelteKit**: `src/routes/**/+page.svelte`

---

## Step 3 — Files to SKIP

Never read or include data from:

- `.env`, `.env.*`, `.env.local`, `.env.production`
- Files matching `*secret*`, `*credential*`, `*password*`, `*token*`
- Auth middleware files (e.g. `middleware.ts`, `auth.ts`, files in `lib/auth/`)
- Database model files (e.g. `models/`, `prisma/`, `drizzle/`)
- Private API route handlers (e.g. `app/api/`, `pages/api/`)
- Any file outside the detected route directories listed above

---

## Step 4 — Extract route data

For each route file, extract:

| Field | How to find it |
|---|---|
| `route` | Derive URL path from file path (e.g. `app/pricing/page.tsx` → `/pricing`) |
| `title` | Look for `<title>`, `metadata.title`, `export const metadata`, `<h1>`, or the filename |
| `purpose` | One sentence — infer from component name, heading text, and prop/variable names |
| `elements` | Interactive elements: buttons, links, forms — extract `label`, `selector`, `action` |

For `elements`, focus on:
- `<button>` and `<Button>` components — use their text content as `label`
- `<a>` and `<Link>` — use their text or `aria-label`
- `<form>` — use its heading or submit button label
- For `selector`: prefer `[aria-label="..."]`, `[data-testid="..."]`, or a stable CSS class. Fall back to text content.
- For `action`: use `"click"` for buttons/links, `"submit"` for forms, `"navigate"` for nav links

---

## Step 5 — Build the JSON payload

Produce an array of route objects:

```json
[
  {
    "route": "/pricing",
    "title": "Pricing",
    "purpose": "Displays subscription plan options and lets users upgrade or downgrade.",
    "elements": [
      { "label": "Upgrade to Pro", "selector": "[aria-label='Upgrade to Pro']", "action": "click" },
      { "label": "Contact sales", "selector": "a[href='/contact']", "action": "navigate" }
    ]
  }
]
```

---

## Step 6 — POST to Waypoint API

Send the payload:

```
POST https://api.waypoint.ai/v1/sites/{siteId}/index
Authorization: Bearer {apiKey}
Content-Type: application/json

{ "routes": [ ...array from step 5... ] }
```

Replace `{siteId}` and `{apiKey}` with the values from `.waypoint`.

If the request fails, show the status code and error body, then stop.

---

## Step 7 — Report and hand off

On success:

```
✓ 47 routes indexed.
Your site map is live at waypoint.ai/dashboard.

→ Type /waypoint-install to embed the widget.
```

Do not run `/waypoint-install` automatically. The user must trigger it.

---

## Notes

- This skill is safe to add to CI/CD — it is fully read-only (except the API POST).
- Do not log the API key.
- Re-running this skill on every deploy keeps the index fresh.
