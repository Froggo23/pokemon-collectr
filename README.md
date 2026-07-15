# Pokéfolio

Minimal **Pokémon TCG** collection tracker — browse real card art, add what you own, see **per-card market prices**, and get your **portfolio total**.

**Live:** [https://froggo23.github.io/pokemon-collectr/](https://froggo23.github.io/pokemon-collectr/)

White / minimal UI. Inspired by Collectr. Project layout follows [bulletproof-react](https://github.com/alan2207/bulletproof-react) ideas in a small toy app (`app` · `features` · `shared` · data-access).

---

## Features

| Feature | Detail |
|--------|--------|
| **Card art** | Live images from [images.pokemontcg.io](https://images.pokemontcg.io) |
| **Market prices** | TCGPlayer mids via [Pokémon TCG API](https://docs.pokemontcg.io/) (CardMarket fallback) |
| **Search** | Live catalog search (name) with featured chase cards on load |
| **Binder** | Add / +/− qty / remove; large card visuals |
| **Portfolio** | Collection worth = Σ (unit market × quantity) |
| **Persistence** | `localStorage` by default; optional Supabase sync |

Not affiliated with Pokémon, Nintendo, or TCGPlayer.

---

## Quick start

```bash
git clone https://github.com/Froggo23/pokemon-collectr.git
cd pokemon-collectr
bun install          # or: npm install
bun dev              # or: npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Dev server |
| `bun test` | Vitest unit tests |
| `bun run build` | Production build |
| `bun run setup:supabase` | Apply SQL + write `.env` (needs access token) |
| `./scripts/deploy-pages.sh` | Build + push `gh-pages` |

---

## Data sources

- **Catalog, art, prices:** [Pokémon TCG API v2](https://docs.pokemontcg.io/) (`api.pokemontcg.io`)
  - No key required for light use
  - Optional: free key from [dev.pokemontcg.io](https://dev.pokemontcg.io) → `VITE_POKEMONTCG_API_KEY` for higher rate limits
- **Offline / tests:** small seed catalog under `src/features/catalog/data/seed-catalog.ts` (includes real image CDN URLs)

---

## Optional Supabase backend

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. SQL Editor → run `supabase/migrations/20260716000000_pokefolio.sql`.
3. Copy **Project URL** + **anon** key:

```bash
cp .env.example .env
# set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Or with a [personal access token](https://supabase.com/dashboard/account/tokens):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
# optional: export SUPABASE_PROJECT_REF=your_ref
bun run setup:supabase
```

Without Supabase env vars the app runs on **local** mode (live TCG API + `localStorage`).

---

## GitHub Pages deploy

Site is published from the **`gh-pages`** branch:

```bash
GITHUB_PAGES=true VITE_BASE=/pokemon-collectr/ bun run build
# then push dist contents to gh-pages (see scripts/deploy-pages.sh)
```

Live URL: **https://froggo23.github.io/pokemon-collectr/**

---

## Project layout

```text
src/
  app/                      App shell
  features/
    catalog/                Pokémon TCG API client, card art, browse/search UI
    inventory/              binder state, list UI, optional Supabase sync
    portfolio/              pure valuation (unit × qty → total) + summary
  shared/                   layout, format, supabase client
  styles/                   global minimal CSS
supabase/migrations/        optional Postgres schema
```

Valuation is pure and unit-tested (`src/features/portfolio/utils/valuation.test.ts`).

---

## Stack

- React 19 + TypeScript + Vite
- Vitest
- `@supabase/supabase-js` (optional)
- Pokémon TCG API (public)

---

## License

Toy / demo project. Card data and images belong to their respective rights holders.
