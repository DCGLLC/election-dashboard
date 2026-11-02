# Valley Vote

A mobile-first election watchlist for Cameron County, Texas, statewide offices, Texas Senate and House races, U.S. Senate, and all 38 Texas congressional districts.

## Run

Requires Node.js 24 or later. The local server needs no dependencies or API keys. Cloudflare deployment uses the pinned Wrangler dependency and pnpm lockfile.

```
node --use-system-ca server.mjs
```

Open http://127.0.0.1:3000. `pnpm run check` checks JavaScript syntax; `node --test` checks Worker routing. See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Desktop and Cloudflare publishing instructions.

## Current scope

- Search and filter elections, save a personal watchlist in browser local storage, and open race details.
- Official Cameron County and Texas results links, KRGV election coverage, and ValleyCentral newsroom links.
- Server attempts to retrieve source pages every 60 seconds while the dashboard is open. It extracts election-related links and labels retrieval times. Errors are displayed without fabricated results. No browser CORS proxy is required.
- This is a source-monitoring foundation, not a live vote-count aggregator. Links may include historical or unrelated races. No candidates, vote counts, or race calls are synthesized. Source changes refer to extracted links, not vote changes.
- No user accounts, cross-device sync, push notifications, background polling, or public deployment.

## Next integration

Connect documented or licensed race-level feeds, mapping each election date, office, district, source timestamp, candidate, vote total, and certification status. Keep county-only and district-wide totals distinct. Add feed adapters and data-contract tests before showing vote totals. District selection is manual; this version does not infer a voter's district. Source URLs were checked November 2, 2026; the November 3 election is the initial focus.
