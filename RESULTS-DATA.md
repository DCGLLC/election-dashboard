# Live count and forecast data

## Connected free data

`GET /api/results` returns a normalized snapshot for November 3, 2026. The public UI uses this endpoint and displays data in the dashboard rather than linking visitors to monitoring sites.

- **Texas Secretary of State:** retrieves the official November results page every 60 seconds and parses each candidate's party, ballots cast, and polling-location reporting percentage. The parser restricts data to the November 2026 general election and the separately labeled Senate District 22 special election. It currently recognizes 206 regular contests. Empty ballot cells remain unknown, never zero. Candidate vote share is calculated only when every listed candidate has a valid count and their total is positive. No winner is inferred from a lead, a majority, or full location reporting.
- **Official state election offices via Open America (openamerica.io):** uses the documented public Senate feed, with attribution retained per report. Coverage is limited to states supported by that service; a missing seat is never a zero. It does not contain candidate rosters before results arrive, forecasts, or race calls. Its reporting percentage is precincts reporting. It is polled at most once a minute while live and once every ten minutes before counting; ETags are retained for conditional requests.
- **Cameron County local races:** not connected to a structured November candidate count feed. The dashboard explicitly states this. It does not use historical local-election counts as November results.

## What reporting percentage means

Polling locations reporting, precincts reporting, and percentage of ballots counted are distinct measures. The first available source field is shown with its exact unit. The app does not estimate ballot completion from precincts or locations. The connected Texas and national sources do not provide a percentage of all ballots counted; this field stays unknown.

Retrieval time is distinct from the source's update time. Texas's source timestamp is displayed as the source's local timestamp without inventing a time zone. If retrieval fails after a prior success, earlier data is retained and explicitly marked delayed. A failed request never resets a count to zero.

## Forecasts and winner calls

No forecast or newsroom-call provider is connected. The user deferred paid-feed options. UI fields display `—` and explicit unavailable states; the service returns an empty `forecasts` array. Candidate-name colors identify reported parties (D blue, R red, others neutral), not race calls.

The view model supports both requested metrics independently: `finalVoteShare` (expected final share, percent) and `winProbability` (probability of winning, percent). Ranges take the minimum and maximum reported values across unique, available sources for the same candidate and election. A single source gives a single value. These are cross-source ranges, not statistical confidence intervals, and observed vote share is never used as a forecast. Tests use clearly fictional fixtures to verify these rules; no test predictions are served by the app.

Each report keeps its own candidate counts, update time, reporting units, and `calledWinnerId`. Forecast reports separately support `predictedWinnerId`. A future provider adapter must validate dates, map candidate identities and special elections explicitly, and supply its own provenance. AP and DDHQ are not advertised as connected feeds.

## Authoritative contracts

- [Texas official results page](https://electionresults.sos.state.tx.us/results.html)
- [Open America public API and coverage](https://openamerica.io/elections/api/)
- [AP Elections API: access and race calls](https://developer.ap.org/ap-elections-api/)
- [Decision Desk HQ forecast API: authorization requirements](https://docs.decisiondeskhq.com/reference/get_api-v5-forecast-race-raceid)

`/api/sources` remains for compatibility with the previous site version; the current interface does not use its source links. No credentials, new database, or paid services are required for the connected free adapters.
