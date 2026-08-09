---
description: Implement the Real Oviedo Calendar project described by `PRD.md`, `ARCHITECTURE.md`, and `TECHNICAL_SPEC.md`. The goal is a small, reliable TypeScript project that generates a public ICS calendar from LALIGA fixture data.
applyTo: "**"
---

# Priority order

When making implementation decisions:

1. Preserve the requirements in `PRD.md`.
2. Preserve the architectural guarantees in `ARCHITECTURE.md`.
3. Follow `TECHNICAL_SPEC.md`.
4. Prefer the simplest implementation.
5. Avoid adding infrastructure or dependencies without a concrete reason.

# Do not build

Do not add:

- React/Vue/Angular frontend;
- Express/Nest backend;
- database;
- authentication;
- user accounts;
- mobile app;
- paid services;
- result/score processing in MVP;
- notification systems;
- unnecessary abstractions.

# Configuration

Never hard-code Real Oviedo into filtering logic.

Initial configuration:

```text
team ID: 157
team name: Real Oviedo
competition: laliga-hypermotion-2026
subscription ID: 396
timezone: Europe/Madrid
```

These are configuration values.

# API credentials

Never commit the LALIGA API key.

Use an environment variable locally and a GitHub Actions Secret in CI.

Do not print the key in logs.

Do not include it in tests or fixtures.

# Data handling

Keep raw LALIGA API types separate from internal domain models.

Use a normalization layer.

Do not spread LALIGA's snake_case API field names throughout the application.

# Calendar identity

The ICS UID must be stable for a match.

Base it on the LALIGA match ID.

Never include the fixture date/time in the UID.

# Synchronization

Generate the complete calendar from the current API response.

Do not implement a local database or incremental synchronization engine.

If a match disappears from the source, it must disappear from the generated ICS.

If a match changes date/time, its UID must remain unchanged.

# Failure safety

Never replace an existing valid calendar with:

- a failed API response;
- invalid transformed data;
- invalid ICS;
- an unexpected empty result.

Generate into a temporary location first, validate it, then replace the published file.

# Time handling

Use `Europe/Madrid`.

Do not manually add/subtract one or two hours.

Use proper timezone-aware date handling.

All-day events must not have an invented time.

# Testing

Write tests before or alongside implementation for:

- team filtering;
- normalization;
- timed events;
- all-day events;
- stable UID;
- changed fixture data;
- removed fixtures;
- API failures;
- empty-result protection;
- ICS validation.

Do not aim for artificial 100% coverage. Prioritize business-critical behaviour.

# Code quality

Prefer:

- small pure functions;
- explicit types;
- meaningful names;
- async/await;
- clear error handling;
- dependency injection where useful for API access;
- deterministic tests.

Avoid:

- global mutable state;
- hidden network calls in unit tests;
- hard-coded dates;
- hard-coded team names;
- duplicated API endpoint strings.

# Implementation order

Recommended sequence:

1. Project setup.
2. Configuration.
3. API client.
4. Raw API types.
5. Internal Match model.
6. Normalization/filtering.
7. Calendar event mapping.
8. ICS generation.
9. ICS validation.
10. CLI/pipeline entry point.
11. Unit/integration tests.
12. GitHub Actions.
13. GitHub Pages deployment.
14. README documentation.

# Unknown API behaviour

Do not invent unsupported LALIGA API fields.

Where the documentation identifies an unknown, especially unconfirmed fixture times, isolate the logic and add a clearly marked TODO/test fixture rather than guessing.

# MVP boundary

Do not implement match results.

Leave result handling as a documented future enhancement.
