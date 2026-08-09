# Real Oviedo Calendar — Architecture

## 1. Architecture principles

The project deliberately uses a static/serverless architecture:

- No backend server.
- No database.
- No user accounts.
- No frontend application.
- No paid infrastructure.
- Source data is fetched fresh on every scheduled run.
- The complete ICS is regenerated rather than incrementally modified.
- The last valid calendar must survive upstream failures.

## 2. High-level architecture

```text
                    LALIGA public API
                           |
                           v
                  +-------------------+
                  | Data Collector    |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  | Match Normalizer  |
                  | / Team Filter     |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  | ICS Generator     |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  | Validate ICS      |
                  +---------+---------+
                            |
                       valid?
                      +-------+-------+
                      |               |
                     yes              no
                      |               |
                      v               v
              publish calendar     keep old
                      |
                      v
                 GitHub Pages
                      |
             +--------+--------+
             |                 |
             v                 v
       Apple Calendar     Google Calendar
```

## 3. Recommended repository structure

```text
real-oviedo-calendar/
├── src/
│   ├── api/
│   │   └── laliga-client.ts
│   ├── config/
│   │   └── config.ts
│   ├── domain/
│   │   ├── match.ts
│   │   └── calendar-event.ts
│   ├── transform/
│   │   └── match-normalizer.ts
│   ├── calendar/
│   │   └── ics-generator.ts
│   ├── validation/
│   │   └── calendar-validator.ts
│   └── index.ts
├── config/
│   └── config.json
├── public/
│   └── calendar.ics
├── tests/
│   ├── match-normalizer.test.ts
│   ├── ics-generator.test.ts
│   └── pipeline.test.ts
├── .github/
│   ├── workflows/
│   │   └── update-calendar.yml
│   └── copilot-instructions.md
├── package.json
├── tsconfig.json
├── README.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECHNICAL_SPEC.md
│   ├── DATA_SOURCE.md
│   └── DECISIONS.md
└── ...
```

The exact file split may be simplified during implementation if Copilot finds a cleaner equivalent. Behavioural requirements take precedence over this layout.

## 4. Execution flow

1. Load configuration.
2. Load the LALIGA API credential from GitHub Actions secrets/environment.
3. Fetch the available gameweeks.
4. Fetch matches for those gameweeks.
5. Filter matches where either `home_team.id` or `away_team.id` equals the configured team ID.
6. Normalize raw LALIGA objects into an internal `Match` model.
7. Reject matches missing required data.
8. Convert normalized matches to calendar events.
9. Generate a complete ICS document.
10. Validate the generated ICS.
11. Apply the zero-fixture protection.
12. Write the new `public/calendar.ics` only after successful validation.
13. Publish the static file through GitHub Pages.

## 5. Why there is no database

The LALIGA API is the source of truth.

Every run reconstructs the calendar from current source data.

This naturally handles:

- new fixtures;
- removed fixtures;
- postponed fixtures;
- changed dates/times;
- changed venues.

No synchronization state needs to be stored.

## 6. Stable event identity

Use the LALIGA match ID as the basis of the ICS UID.

Example:

```text
laliga-match-102648@real-oviedo-calendar
```

A change from 22 August to 23 August must keep the same UID.

This is essential for calendar clients to treat the change as an update rather than a second event.

## 7. Configuration

Configuration should contain at least:

```json
{
  "competition": "laliga-hypermotion-2026",
  "season": "2026/27",
  "competitionSubscriptionId": 396,
  "team": {
    "id": 157,
    "name": "Real Oviedo"
  },
  "timezone": "Europe/Madrid"
}
```

The API key must never be committed to the repository.

## 8. GitHub Actions

Schedule:

```yaml
on:
  schedule:
    - cron: "0 * * * *"
```

The workflow should also support `workflow_dispatch`.

The API key is supplied through GitHub Actions Secrets.

## 9. Publishing strategy

GitHub Pages serves the contents of `public/`.

The workflow updates `public/calendar.ics` and deploys the static site.

The public subscription URL must remain stable across seasons.

## 10. Reliability model

The current public ICS is considered the last known good version.

A failed fetch, failed transformation, or failed validation must never replace it.

The implementation should fail closed:

```text
error -> no publication
```

rather than:

```text
error -> empty calendar publication
```

## 11. Security

Do not hard-code or commit the LALIGA API key.

Use:

- GitHub Actions Secrets for CI.
- Environment variables for local execution.

The key observed in browser requests is an application/API credential, not a user account credential. Its continued availability is an external dependency and may change without notice.

## 12. Extensibility

The following must be configuration-driven:

- team ID/name;
- competition slug;
- competition subscription ID;
- season;
- timezone;
- API endpoint details where practical.

Business logic must not contain Real Oviedo-specific conditionals.
