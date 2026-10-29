# Stalzone Labs

Artifact build finder, build upgrader, owned inventory, saved builds, and account suggestions.

## Local setup

Install Node.js 24 or newer. Run npm start and open http://127.0.0.1:4180.
The builder uses bundled market snapshots without credentials. Live auction refresh and player lookup require approved EXBO credentials supplied through environment variables (EXBO_CLIENT_ID and EXBO_CLIENT_SECRET, or EXBO_TOKEN). The example file documents the variables; the server does not automatically load .env files.

## Data and privacy

Owned items, saved builds, and preferences stay in each user's browser. Export them before clearing browser data. Credentials, live market caches, personal exports, local backups, and Windows launchers are excluded from this repository.

## Checks

Run npm run check for JavaScript syntax checks.

## Deployment

Render settings: Node runtime, branch main, build command npm run check, start command npm start, health check /healthz. Attach a persistent disk at /var/data and set MARKET_CACHE_DIR=/var/data/market-cache. Add approved EXBO credentials as private environment variables. Render supplies PORT and its public hostname automatically. For a custom domain, set PUBLIC_URL to its full HTTPS URL.

Market refresh jobs are server scheduled; public refresh requests are disabled. Regional caches are saved atomically on disk. Build searches run in browser workers.

The server can start without EXBO credentials using the included NA snapshot; live refresh and player lookup remain unavailable until configured.

## Licensing

An open-source license has not yet been selected. Item data, artwork, and bundled third-party assets retain their respective owners' rights. Publishing the source does not grant additional rights to those assets.

## Market collection and releases

Public browsers only read cached prices. POST /api/refresh is disabled, including for older clients. The server checks for stale prices each minute and refreshes each artifact no more often than six hours by default, one region at a time. All upstream requests, including player lookup, share a serial queue with at least 1.5 seconds between requests by default (minimum one second). HTTP 429/401/403 stops upstream requests for at least one hour, or longer when Retry-After requires it. These are conservative application defaults, not a guarantee of EXBO quota compliance; account-specific limits still apply. MARKET_REFRESH_ENABLED=false disables scheduled collection.

Local edits and commits do not change the live service. With Render auto-deploy On Commit, pushing or merging into main triggers deployment. For unpublished work, use a feature branch, test locally, and merge into main when ready. This does not require a second repository or a paid staging service.

Refresh progress is checkpointed after each artifact. Interrupted collections resume after restart using each artifact’s collected timestamp; the six-hour regional cooldown is recorded only after completion. Failed runs wait at least 15 minutes (or the longer upstream pause) before retrying. Legacy attempted-start markers are ignored.

Collection rotates through four-artifact batches across NA, EU, SEA, and RU so initial coverage reaches all markets before any one region finishes. Artifact-specific HTTP 400/404 failures are deferred for six hours without blocking other items. Other item failures wait 15 minutes; global upstream pauses still take precedence. The prices endpoint exposes collection status and the browser checks cached status once a minute without initiating EXBO requests.
