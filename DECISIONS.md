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
