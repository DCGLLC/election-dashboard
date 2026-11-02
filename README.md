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
- Official Cameron County and Texas results links, KRGV election coverage, ValleyCentral newsroom links, official election offices for the other states with Senate races, and AP national election coverage. State election-office portals and AP are direct links, clearly labeled separately from monitored sources.
- Server attempts to retrieve source pages every 60 seconds while the dashboard is open. It extracts election-related links and labels retrieval times. Errors are displayed without fabricated results. No browser CORS proxy is required.
- This is a source-monitoring foundation, not a live vote-count aggregator. Links may include historical or unrelated races. No candidates, vote counts, or race calls are synthesized. Source changes refer to extracted links, not vote changes.
- No user accounts, cross-device sync, push notifications, or background polling. Cloudflare publishes the site from the connected GitHub repository after changes are committed and pushed.

## Next integration

Connect documented or licensed race-level feeds, mapping each election date, office, district, source timestamp, candidate, vote total, and certification status. Keep county-only and district-wide totals distinct. Add feed adapters and data-contract tests before showing vote totals. District selection is manual; this version does not infer a voter's district. Source URLs were checked November 2, 2026; the November 3 election is the initial focus.
