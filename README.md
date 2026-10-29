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

Market refresh jobs are shared across visitors; only one runs at a time. Recently collected artifact data is reused for 15 minutes, including manual requests, to prevent visitors repeatedly collecting the same data. Regional caches are saved atomically on disk. Build searches run in browser workers.

The server can start without EXBO credentials using the included NA snapshot; live refresh and player lookup remain unavailable until configured.

## Licensing

An open-source license has not yet been selected. Item data, artwork, and bundled third-party assets retain their respective owners' rights. Publishing the source does not grant additional rights to those assets.
