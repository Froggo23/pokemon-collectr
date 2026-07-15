# Pokéfolio

A Collectr-style **toy** for listing Pokémon cards you own, viewing **per-card market values**, and seeing **total inventory worth**.

White / minimalist UI. Structure follows [bulletproof-react](https://github.com/alan2207/bulletproof-react) principles in a practical toy form (`app` / `features` / `shared` / data-access APIs).

## Run

```bash
cd pokemon-collectr
bun install   # or npm install
bun dev       # or npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Supabase backend (optional → recommended)

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Run SQL in the SQL editor: `supabase/migrations/20260716000000_pokefolio.sql`
3. Copy **Project URL** + **anon key** into `.env`:

```bash
cp .env.example .env
# edit VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Or with a [personal access token](https://supabase.com/dashboard/account/tokens):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
# optional: export SUPABASE_PROJECT_REF=your_ref
bun run setup:supabase
```

Without Supabase env vars the app still works in **local** mode (seed catalog + `localStorage`).

### Host (GitHub Pages)

Repo: push to GitHub and enable Pages via Actions. Workflow: `.github/workflows/pages.yml`.

Optional repo secrets for cloud backend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase MCP (Grok)

Configured as HTTP MCP: `https://mcp.supabase.com/mcp` (OAuth).  
Authorize once in Grok (`grok mcp doctor supabase`) to manage projects from the agent.

## Test

```bash
bun test      # or npm test
```

Valuation math is unit-tested against the real catalog seed and inventory helpers (no mocked unit-under-test).

## Features

- **Catalog seed** with market mid prices (`pricedAsOf`) under `src/features/catalog/`
- **Inventory** add / qty +/− / remove with `localStorage` persistence
- **Portfolio total** = Σ (unit market × quantity)
- **Per-line** unit price and line total in the inventory list

## Layout (bulletproof-style)

```text
src/
  app/                 App shell
  features/
    catalog/           seed data + getCatalog API + search UI
    inventory/         types, hooks, list UI
    portfolio/         pure valuation utils + summary UI
  shared/              layout, format helpers
  styles/
```

## Notes

- Prices are a **seeded catalog** (documented snapshot), not a live paid API—still real data fields driving totals.
- No auth, trading, or multi-TCG scope.
