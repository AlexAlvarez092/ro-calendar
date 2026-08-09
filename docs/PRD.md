# Real Oviedo Calendar — Product Requirements Document

## 1. Overview

A free, public ICS calendar for Real Oviedo fixtures from LALIGA HYPERMOTION.

The calendar is automatically refreshed through GitHub Actions and served through GitHub Pages so users can subscribe from Apple Calendar, Google Calendar, Android, or other clients supporting ICS subscriptions.

The MVP is intentionally small: one team, one competition/season, no user accounts, no database, no mobile app, and no match-result synchronization.

## 2. Goals

- Provide an always-current calendar for Real Oviedo fixtures.
- Automatically reflect fixture additions, removals, and schedule changes.
- Work with Apple Calendar and Google Calendar/Android.
- Operate entirely with free infrastructure.
- Keep team, competition, season, and other relevant values configurable for future reuse.
- Be simple enough for a personal project and straightforward for GitHub Copilot to implement.

## 3. MVP configuration

Initial configuration:

- Competition: `laliga-hypermotion-2026`
- Season: `2026/27`
- Team: Real Oviedo
- Team ID: `157`
- Competition subscription ID: `396`
- Time zone: `Europe/Madrid`

These values must be configuration, not business-logic constants.

At the end of a season, configuration can be manually changed for the next season.

## 4. Calendar behaviour

### New fixture

If a fixture appears in the source data, it must appear in the generated calendar.

### Removed fixture

If a fixture no longer appears in the source data, it must no longer appear in the generated calendar.

### Changed fixture

If a fixture's date/time, venue, or other relevant information changes, the existing calendar event must be updated.

The event UID must remain stable and be based on the LALIGA match ID.

### Unconfirmed time

When the source indicates that the fixture date is known but its exact time is not confirmed, create an all-day event.

The exact API rule for detecting an unconfirmed time is not yet confirmed because the season has not started. This logic must therefore be isolated in one parser/normalizer function rather than guessed throughout the code.

### Insufficient data

Do not generate an event when the minimum required information is missing.

No warning/notification system is required for MVP.

## 5. Event contents

Each event contains:

- Title: `<home team> - <away team>`
- Date/time, or an all-day date when the time is unconfirmed
- Location: venue name when available
- Jornada/gameweek number

No home/away icons are required. The first team in the title identifies the home team.

The calendar uses `Europe/Madrid`.

## 6. Update frequency

GitHub Actions runs once per hour.

The workflow retrieves the latest source data and regenerates the calendar.

The actual refresh frequency of Apple Calendar/Google Calendar subscriptions is controlled by those clients and cannot be guaranteed by this project.

## 7. Failure behaviour

If LALIGA cannot be reached or the source data cannot be successfully processed:

- Do not replace the last valid `calendar.ics`.
- The workflow may fail.
- The existing public calendar remains available.

If a successful response unexpectedly produces zero relevant fixtures, do not overwrite an existing valid calendar. This protects against accidental data loss caused by an upstream/API anomaly.

## 8. Public access

The calendar is public.

Anyone who knows the ICS URL can subscribe to it.

No authentication or user management is required.

## 9. Hosting

- Source code: GitHub repository
- Automation: GitHub Actions
- Public ICS: GitHub Pages

No application server is required.

## 10. Non-goals for MVP

- User registration/authentication
- Web/mobile UI
- User-specific calendars
- Favourite-team selection UI
- Database/storage of fixtures
- Match scores/results
- Live match information
- Notifications
- Automatic season rollover
- Professional monitoring/alerting
- Paid hosting

Potential post-MVP enhancements are tracked as GitHub Issues.

## 11. Acceptance criteria

The MVP is complete when:

1. The repository can be cloned and installed with documented commands.
2. A workflow can retrieve the configured LALIGA data.
3. Only the configured team's fixtures are included.
4. The generated ICS is valid.
5. Events contain title, date/time or all-day state, location when available, and jornada.
6. Event UIDs remain stable when fixture details change.
7. Removed fixtures disappear from subsequent generated calendars.
8. An upstream failure does not replace the previous valid ICS.
9. The workflow runs automatically every hour.
10. GitHub Pages exposes the ICS at a stable public URL.
11. The resulting URL can be subscribed to from Apple Calendar and Google Calendar.
12. Automated tests cover the core transformation and failure cases.
