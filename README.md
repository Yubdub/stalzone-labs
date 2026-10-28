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

This is the current local-server version. Public hosting still requires configurable port and host validation, durable market storage, and shared refresh coordination. Do not deploy this version unchanged to Render.

## Licensing

An open-source license has not yet been selected. Item data, artwork, and bundled third-party assets retain their respective owners' rights. Publishing the source does not grant additional rights to those assets.
