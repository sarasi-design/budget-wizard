# Budget Wizard — deployable build

A self-contained static site. No build step, no dependencies to install.

## Deploy to Vercel
**Option A — drag & drop:** go to vercel.com → "Add New… → Project" → drag this whole folder onto the page. Done.

**Option B — CLI:**
```
npm i -g vercel
cd deploy
vercel
```
Accept the defaults (framework preset: "Other"). Vercel serves `index.html` at the root automatically.

**Option C — Git:** commit this folder to a repo and import it in Vercel. No special config needed; it's plain static files.

## What's inside
- `index.html` — entry point (loads React + Babel from CDN, then the step files)
- `hifi-kit.jsx` — tokens, icons, math (IRPF), shared components
- `hifi-step1-income.jsx` … `hifi-step6-plan.jsx` — the six wizard steps

## Notes
- This is a **prototype build**: it transpiles JSX in the browser at load (you'll see one console warning — harmless, just not optimal). Fine for a demo. For a production app, precompile (Vite) — see the separate developer-handoff package.
- Requires an internet connection (fonts, icons, React load from CDN).
- User input persists in the browser via `localStorage`; the in-app **Reset** button clears it.
- The PDF download opens a print window — users may need to allow pop-ups.
- Tax figures are an **estimate** (Spain IRPF + SS, no regional/family specifics). Have them reviewed before treating as advice.
