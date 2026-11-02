# Valley Vote

A mobile-first election watchlist for Cameron County, Texas, all 150 Texas House districts, all 38 Texas congressional districts, Texas Senate contests on the November 2026 ballot, and all 35 U.S. Senate elections nationwide.

## Run

Requires Node.js 24 or later. The local server needs no dependencies or API keys. Cloudflare deployment uses the pinned Wrangler dependency and pnpm lockfile.

```
node --use-system-ca server.mjs
```

Open http://127.0.0.1:3000. `pnpm run check` checks JavaScript syntax; `node --test` checks Worker routing. See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Desktop and Cloudflare publishing instructions.

## Current scope

- Search and filter by office, state, and election level; browse pages of races, save a personal watchlist in browser local storage, and open race details.
- The U.S. Senate list includes 33 regular elections and the Florida and Ohio special elections. The Texas Senate list includes 16 regular contests and the District 22 special election, each separately selectable. Existing featured-election IDs are preserved. See [ELECTION-SOURCES.md](ELECTION-SOURCES.md) for schedule references.
- A compact opening list with an Add elections button, saved races, blue Democratic names, red Republican names, current counts and vote shares, and a current-leader indicator. New visitors start with an empty list; existing saved races are preserved. Forecasts and source comparisons appear only after opening a race.
- Direct Texas official count adapter and a partial national Senate count adapter using official state data via Open America. Checks run while the dashboard is open; upstream caching limits duplicate requests. The app does not turn missing counts into zero.
- Final vote-share and win-probability range fields are implemented, but no forecast or newsroom winner-call provider is connected. Missing values are clearly unavailable. See [RESULTS-DATA.md](RESULTS-DATA.md) for coverage, reporting units, data contracts, and limitations. Cameron County local candidate counts still need an election-night feed.
- No user accounts, cross-device sync, push notifications, or background polling. Cloudflare publishes the site from the connected GitHub repository after changes are committed and pushed.

## Next integration

Connect documented or licensed race-level feeds, mapping each election date, office, district, source timestamp, candidate, vote total, and certification status. Keep county-only and district-wide totals distinct. Add feed adapters and data-contract tests before showing vote totals. District selection is manual; this version does not infer a voter's district. Source URLs were checked November 2, 2026; the November 3 election is the initial focus.
