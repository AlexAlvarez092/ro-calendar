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

Set the API key as an environment variable:

```text
LALIGA_API_KEY=...
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

## Subscription

Once GitHub Pages is enabled, the public calendar URL can be subscribed to from Apple Calendar or Google Calendar.

The URL should remain stable across seasons.

## Project documentation

- `PRD.md` — product requirements
- `ARCHITECTURE.md` — architecture and system design
- `TECHNICAL_SPEC.md` — implementation details
- `DATA_SOURCE.md` — LALIGA API discovery and assumptions
- `COPILOT_INSTRUCTIONS.md` — implementation guidance for GitHub Copilot
- `DECISIONS.md` — agreed decisions

## Important dependency

The project depends on the public LALIGA web API and its API access mechanism.

LALIGA can change endpoints, response structures, or API credentials without notice.
