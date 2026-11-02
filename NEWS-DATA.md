# Federal race polls and estimates

Opening a federal race shows an average first, then FOX News, CNN, NBC News and ABC News. Poll support, estimated final vote share, numerical win probability and qualitative race ratings remain separate. County federal entries use full-election polling, explicitly labeled separately from county-only official counts.

The poll mean uses the newest verified likely-voter poll per network with fieldwork ending within 30 days. Identical underlying poll IDs count once. Missing candidates, invalid percentages, future dates, old fieldwork and failed-refresh reports do not contribute. Each candidate and metric shows its own contributing count. Undecided responses are not redistributed, and poll support is never treated as win probability. Race ratings are displayed as words and cannot enter numerical averages.

## Initial verified coverage — November 2, 2026

- FOX News: [Texas Senate poll](https://www.foxnews.com/politics/fox-news-poll-texas-senate-race-galloping-toward-photo-finish), fieldwork October 15–19; [Ohio and South Carolina Senate rating changes](https://www.foxnews.com/politics/fox-news-power-rankings-south-carolina-moves-toss-up.amp), October 29.
- CNN: [network transcript reporting its Senate polls](https://transcripts.cnn.com/show/cnc/date/2026-10-29/segment/01) for Texas, Michigan, Kansas and Maine, October 29. Fieldwork October 20–27.
- NBC News: [Texas Senate poll](https://www.nbcnews.com/politics/2026-election/texas-poll-james-talarico-holds-narrow-advantage-senate-greg-abbott-le-rcna598432), published September 21, fieldwork September 8–10. This historical poll is displayed but excluded from the current mean. The article was retrieved and verified directly; local Cloudflare runtime retrieval failed, so a verified factual baseline is retained and explicitly marked delayed when refreshing fails.
- ABC News: [Senate ratings](https://abcnews.com/amp/Politics/key-senate-races-determine-party-controls-body-year/story?id=137301095) for Michigan, Texas, Alaska, Ohio, Kansas, Maine and Iowa, October 26.

There are no verified House polls in this initial registry, and no numerical final-share forecast or win-probability feed from these networks is connected. All four source headings still appear with honest unavailable states for missing race coverage. These articles are not advertised as the latest publication from each newsroom.

## Refresh and provenance

The server rechecks the five registered primary documents every 15 minutes while receiving dashboard requests. This checks those documents for supported data; it does not search for newly published articles. Adding new documents, broader House coverage or automated discovery requires extending `newsDocuments` and its parsers, or connecting a documented provider. No paid subscription or API key was introduced.

Every report retains its source URL, publication date, poll fieldwork dates, pollster, available sample information, retrieval time and refresh status. Only short numerical facts and ratings are served; article text is not republished. Supported formats and dates are checked before importing. A failed refresh retains prior verified data as delayed and excludes it from averages; unknown coverage stays unknown.

Tests cover independent metrics, deduplication, age and population filters, missing values, county/full-election mapping, changed source documents and failed refreshes. Local Cloudflare runtime checks verified FOX, CNN and ABC imports; NBC's verified fallback is needed where its server request is blocked. Production accessibility can differ by upstream service.
