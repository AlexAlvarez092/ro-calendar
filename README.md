# Real Oviedo Calendar

A free, automatically updated ICS calendar for Real Oviedo fixtures from LALIGA HYPERMOTION.

The calendar is designed to work with:

- Apple Calendar
- Google Calendar
- Android calendar clients supporting ICS subscriptions

## How it works

```text
LALIGA API
    ↓
GitHub Actions (hourly)
    ↓
Fetch + filter Real Oviedo fixtures
    ↓
Generate + validate calendar.ics
    ↓
GitHub Pages
    ↓
Public ICS subscription URL
```

There is no database, backend server, or user account.

## MVP

The initial version supports:

- Real Oviedo
- LALIGA HYPERMOTION 2026/27
- regular fixtures and playoff fixtures exposed by the competition
- date/time updates
- venue updates
- fixture additions/removals
- all-day events when the schedule is not confirmed
- Europe/Madrid timezone

Match results are intentionally not implemented in MVP.

## Local setup

Requirements:

- Node.js
- npm

Install:

```bash
npm install
```

Set API credentials as environment variables (optional):

```text
LALIGA_API_KEY=...
LALIGA_BACKEND_API_KEY=...
LALIGA_WEBVIEW_API_KEY=...
```

Notes:

- `LALIGA_API_KEY` is a legacy/shared fallback.
- `LALIGA_BACKEND_API_KEY` and `LALIGA_WEBVIEW_API_KEY` can be used when LALIGA uses different keys per endpoint.
- If none are set, the generator attempts dynamic discovery from LALIGA runtime config.
- If `LALIGA_API_KEY` is set but returns `401`, the generator retries with dynamic discovery.

Recommended local setup:

```bash
cp .env.example .env
# then edit .env and set optional key variables
```

Run tests:

```bash
npm test
```

Generate locally:

```bash
npm run generate
```

Build:

```bash
npm run build
```

## Deployment

GitHub Actions runs hourly and can also be triggered manually.

The API key is stored as a GitHub Actions Secret.

The generated `calendar.ics` is published through GitHub Pages.

Required GitHub setup:

1. Create repository secrets as needed (`LALIGA_API_KEY`, or `LALIGA_BACKEND_API_KEY` + `LALIGA_WEBVIEW_API_KEY`).
2. Enable GitHub Pages for this repository (source: GitHub Actions).
3. Ensure the workflow in `.github/workflows/update-calendar.yml` is enabled.

## Subscription

Once GitHub Pages is enabled, the public calendar URL can be subscribed to from Apple Calendar or Google Calendar.

The URL should remain stable across seasons.

## Project documentation

- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — architecture and system design
- `docs/TECHNICAL_SPEC.md` — implementation details
- `docs/DATA_SOURCE.md` — LALIGA API discovery and assumptions
- `.github/copilot-instructions.md` — implementation guidance for GitHub Copilot
- `docs/DECISIONS.md` — agreed decisions

## Important dependency

The project depends on the public LALIGA web API and its API access mechanism.

LALIGA can change endpoints, response structures, or API credentials without notice.
