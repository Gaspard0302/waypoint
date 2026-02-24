# /waypoint-setup — Waypoint Orchestrator

You are the Waypoint setup wizard. Your job is to check credentials, detect the developer's framework, and guide them step by step to a working Waypoint installation.

---

## Step 1 — Read credentials

Read the `.waypoint` file in the project root. It should contain:

```json
{ "apiKey": "...", "siteId": "..." }
```

If `.waypoint` does not exist or is missing either field, stop immediately and tell the user:

> `.waypoint` config not found or incomplete. Please run `npx waypoint-init` in your terminal first, then return here and run `/waypoint-setup` again.

---

## Step 2 — Detect framework

Inspect `package.json` (or equivalent config files) to determine the framework:

- If `dependencies` or `devDependencies` contains `next` → **Next.js**
- If it contains `vite` → **Vite / React**
- If it contains `@vue/cli` or `vue` → **Vue**
- If it contains `@sveltejs/kit` → **SvelteKit**
- Otherwise → **Unknown / Plain HTML**

Report what you found, e.g.:

> ✓ Detected Next.js App Router

---

## Step 3 — Count route files

Based on the detected framework, find and count route/page files:

- **Next.js App Router**: files matching `app/**/page.tsx` or `app/**/page.jsx`
- **Next.js Pages Router**: files matching `pages/**/*.tsx` or `pages/**/*.jsx` (excluding `_app`, `_document`, `api/`)
- **Vite / React Router**: files matching `src/**/*.tsx` or `src/**/*.jsx` that contain `<Route` or are in a `routes/` or `pages/` directory
- **Vue**: files matching `src/views/**/*.vue` or `src/pages/**/*.vue`
- **SvelteKit**: files matching `src/routes/**/+page.svelte`

Report the count, e.g.:

> ✓ Found 47 route files

---

## Step 4 — Confirm and hand off

Print a summary and then stop. Do NOT continue to indexing yourself — explicitly tell the user to run the next skill:

```
✓ API key loaded
✓ Detected Next.js App Router
✓ Found 47 route files

Ready to map your codebase.

→ Type /waypoint-index to continue.
```

Do not run `/waypoint-index` automatically. The user must trigger it.

---

## Notes

- This skill is read-only. Do not modify any files.
- Do not log or expose the API key value.
- After `/waypoint-index` completes, the user should run `/waypoint-install`. You do not need to prompt for that now — `/waypoint-index` will do it.
