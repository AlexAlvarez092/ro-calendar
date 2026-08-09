# Architecture & Product Decisions

This file records the decisions made during project discovery.

## Product

- Personal project, not a professional SaaS.
- Free operation is a core requirement.
- MVP is Real Oviedo only.
- Architecture must be configurable for another team/season later.
- No user-facing team selector in MVP.
- Public calendar; anyone with the URL can subscribe.
- Apple Calendar and Google Calendar/Android are target clients.

## Fixtures

- Include all configured-team fixtures returned by the competition.
- Include playoffs when exposed by the source.
- New source fixture -> add event.
- Removed source fixture -> remove event.
- Changed source fixture -> update existing event.
- Stable UID is based on match ID.
- Unconfirmed time -> all-day event.
- Do not invent a duration for all-day fixtures.

## Event data

Required:

- title
- date
- time when confirmed
- location when available
- jornada

Title format:
`Home team - Away team`

No home/away icons.

Timezone:
`Europe/Madrid`

## Updates

- GitHub Actions runs hourly.
- The calendar is regenerated from scratch.
- If LALIGA fails, keep the previous calendar.
- If generated data is invalid, keep the previous calendar.
- If an unexpected empty result occurs, keep the previous calendar.
- No warnings/notifications are required for MVP.

## Infrastructure

- GitHub repository.
- GitHub Actions.
- GitHub Pages.
- No database.
- No backend.
- No paid hosting.

## API

- LALIGA public web API is the source of truth.
- Initial competition subscription ID: 396.
- Initial team ID: 157.
- API key is supplied externally through secrets/environment.
- Never commit the key.

## Future

- Match results are a nice-to-have, not MVP.
- Season configuration is changed manually at the end of the season.

## Decisions closed on 2026-08-09

- Unconfirmed kick-off time must be represented as a true all-day event (birthday-style), not as an invented midnight time.
- If generation would produce zero fixtures and no previous `public/calendar.ics` exists yet, the run should fail closed and not create a new empty calendar file.
- Publishing strategy: use GitHub Pages with the official Pages workflow (`actions/upload-pages-artifact` + `actions/deploy-pages`) from a generated artifact, to avoid committing generated files on every run.
- ICS generation library choice for MVP: use a dedicated npm ICS generator with timezone/all-day support and keep validation as a separate explicit step.
- ICS validation strategy for MVP: combine structural checks (required fields, duplicate UIDs, all-day rules) with strict parse validation before publish.

## Delivery workflow

- The coding agent should work autonomously by default and only stop for missing product decisions, credentials, or explicit user approval gates.
- Use small, frequent commits with clear intent, instead of large batches at the end.
- Prefer one logical change per commit (for example: config, API client, normalization, ICS mapping, validation, tests, CI).
