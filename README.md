# Valley Vote

A mobile-first election watchlist for Cameron County, Texas, all 150 Texas House districts, all 38 Texas congressional districts, Texas Senate contests on the November 2026 ballot, and all 35 U.S. Senate elections nationwide.

## Run

Requires Node.js 24 or later. Install dependencies with `pnpm install --frozen-lockfile`; no API keys are required. Cloudflare deployment uses the pinned Wrangler dependency and pnpm lockfile.

```
node --use-system-ca server.mjs
```

Open http://127.0.0.1:3000. `pnpm run check` checks JavaScript syntax; `node --test` checks Worker routing. See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Desktop and Cloudflare publishing instructions.

## Current scope

- Search and filter by office, state, and election level; browse one scrollable results table, save a personal watchlist in browser local storage, and open race details.
- The U.S. Senate list includes 33 regular elections and the Florida and Ohio special elections. The Texas Senate list includes 16 regular contests and the District 22 special election, each separately selectable. Existing featured-election IDs are preserved. See [ELECTION-SOURCES.md](ELECTION-SOURCES.md) for schedule references.
- A single opening table with an Add elections button, race headings above candidate rows, blue Democratic names, red Republican names, win probability ranges, votes, vote shares, reporting percentages, and current-leader indicators. New visitors start empty; saved races are preserved. Click a race for source comparisons and final vote-share forecasts.
- Direct Texas official count adapter and a partial national Senate count adapter using official state data via Open America. Checks run while the dashboard is open; upstream caching limits duplicate requests. The app does not turn missing counts into zero.
- Cameron County includes all 86 contests from the official November ballot set, with category filters and individual or bulk adding. County summary discovery and parsing are implemented; current county requests are blocked upstream and no November count report has been verified. See [CAMERON-COUNTY.md](CAMERON-COUNTY.md).
- Final vote-share and win-probability range fields are implemented, but no forecast or newsroom winner-call provider is connected. Missing values are clearly unavailable. See [RESULTS-DATA.md](RESULTS-DATA.md) for coverage, reporting units, data contracts, and limitations.
- Federal details show FOX News, CNN, NBC News and ABC News polling/ratings with a separate numeric average above them. Initial coverage is partial and limited to verified Senate documents; there are no verified House polls or numerical probability forecasts yet. See [NEWS-DATA.md](NEWS-DATA.md) for exact coverage, date filters, provenance and refresh limitations.
- Simple email/password accounts and private cross-device watchlists are implemented. A Supabase project and public configuration must be supplied before enabling signup; until then the original browser-only selections are preserved. See [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md). There are no push notifications or polling while the site is closed.
- The free Pages deployment targets `dcg-my-elections-texas.pages.dev` (availability pending), with `pnpm run build:pages` and output `release/pages`. The original Worker remains supported using `wrangler.worker.jsonc`. Cloudflare publishes after committed changes are pushed to its connected repository.

## Next integration

Connect documented or licensed race-level feeds, mapping each election date, office, district, source timestamp, candidate, vote total, and certification status. Keep county-only and district-wide totals distinct. Add feed adapters and data-contract tests before showing vote totals. District selection is manual; this version does not infer a voter's district. Source URLs were checked November 2, 2026; the November 3 election is the initial focus.
