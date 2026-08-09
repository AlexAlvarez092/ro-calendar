# Real Oviedo Calendar — Technical Specification

## 1. Technology

- Node.js
- TypeScript
- npm
- GitHub Actions
- GitHub Pages
- An established npm iCalendar/ICS generation library

Avoid introducing a web framework, database, or server unless a concrete requirement appears.

## 2. External API

The discovered LALIGA API exposes match data with a structure similar to:

```json
{
  "matches": [
    {
      "id": 102648,
      "name": "Temporada 2026/2027 - LALIGA HYPERMOTION - Real Oviedo - CD Leganés - 2",
      "date": "2026-08-22T15:00:00+00:00",
      "time": "2026-08-22T15:00:00+00:00",
      "status": "PreMatch",
      "home_team": {
        "id": 157,
        "name": "Real Oviedo SAD",
        "nickname": "Real Oviedo",
        "shortname": "OVI"
      },
      "away_team": {
        "id": 54,
        "nickname": "CD Leganés"
      },
      "venue": {
        "name": "Estadio Carlos Tartiere"
      },
      "subscription": {
        "id": 396,
        "name": "LALIGA HYPERMOTION",
        "slug": "laliga-hypermotion-2026"
      }
    }
  ]
}
```

The actual endpoint paths discovered during reverse engineering should be stored in the API client rather than scattered throughout the application.

## 3. Internal domain model

Suggested model:

```ts
interface Match {
  id: number;
  competition: string;
  round: number | string;
  status: string;
  date: Date | null;
  hasConfirmedTime: boolean;
  homeTeam: Team;
  awayTeam: Team;
  venue: string | null;
}

interface Team {
  id: number;
  name: string;
  shortName?: string;
  nickname?: string;
}
```

The internal model must not expose raw API field names such as `home_team`.

## 4. Filtering

A fixture belongs to the configured team when:

```ts
match.home_team.id === config.team.id ||
match.away_team.id === config.team.id
```

Do not filter by team name.

## 5. Round/jornada

The collector should preserve the gameweek/round associated with the request.

The event must expose the jornada number.

If the API's gameweek representation includes special playoff rounds, preserve those values rather than assuming all rounds are 1–42.

## 6. Calendar event

Suggested conceptual model:

```ts
interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  location?: string;
  description?: string;
}
```

For an all-day fixture:

- use the local match date;
- set `allDay = true`;
- do not invent a duration or start time.

For a timed fixture:

- convert the source timestamp correctly;
- use `Europe/Madrid`;
- set the event end time to two hours after kickoff so the calendar reserves that slot.

## 7. Event title

```text
<home team display name> - <away team display name>
```

Prefer the API's `nickname` where available because it is the public-facing short name.

Example:

```text
Real Oviedo - CD Leganés
```

## 8. Location

Use:

```text
venue.name
```

If venue is unavailable, omit the location rather than inventing one.

## 9. Event description

MVP only requires the jornada to be represented.

A simple description is sufficient:

```text
Jornada 2
```

No score/result data is required.

## 10. Minimum data

An event requires:

- match ID;
- home team ID/name;
- away team ID/name;
- match date;
- enough information to determine the event date.

If required information is missing, skip the event.

## 11. Unconfirmed time

The code must isolate the rule that decides whether a source match has a confirmed time.

Do not infer that midnight or a missing `time` field automatically means unconfirmed without evidence from the API.

Current pre-season data does not provide a verified example of an unconfirmed fixture.

When the rule evaluates to unconfirmed:

```text
calendar event = all-day event
```

This logic should be unit-tested independently.

## 12. API failure

Any failure in:

- network request;
- HTTP status;
- JSON parsing;
- required response structure;

must abort generation.

The existing `public/calendar.ics` must not be overwritten.

## 13. Empty-result protection

If the source request succeeds but the final filtered fixture list is empty, do not overwrite an existing valid calendar.

This is a safety mechanism against unexpected upstream/API behaviour.

## 14. ICS validation

Before publishing:

- verify valid ICS structure;
- verify every event has a UID;
- verify every event has a title;
- verify every event has a valid date;
- verify all-day events do not contain an invented time;
- verify there are no duplicate UIDs.

## 15. Tests

Minimum test set:

### Filtering
- home team is configured team;
- away team is configured team;
- unrelated fixture is excluded.

### Mapping
- title;
- location;
- jornada;
- timezone;
- timed fixture;
- all-day fixture.

### Identity
- same match ID generates same UID.

### Changes
Given the same match ID:
- changing date changes DTSTART;
- changing venue changes LOCATION;
- UID remains unchanged.

### Removal
The generated calendar contains only current source fixtures, so a missing source fixture is absent from the generated ICS.

### Failure
- API failure does not replace previous calendar;
- invalid response does not replace previous calendar;
- invalid generated ICS does not replace previous calendar;
- unexpected empty result does not replace previous calendar.

## 16. Local development

The project should provide:

```text
npm install
npm test
npm run build
npm run generate
```

Exact scripts can be adjusted during implementation.

A local environment variable should provide the API key:

```text
LALIGA_API_KEY=...
```

Implementation note (current behaviour):

- `LALIGA_API_KEY` is treated as a legacy/shared fallback value.
- `LALIGA_BACKEND_API_KEY` and `LALIGA_WEBVIEW_API_KEY` are supported for split-key scenarios.
- If explicit keys are not provided, the implementation may discover runtime API subscriptions from LALIGA public pages.
- If `LALIGA_API_KEY` is provided but returns `401`, the implementation may retry with dynamic discovery.

Never put the actual key in source control.

CI secret names should therefore support either strategy:

```text
LALIGA_API_KEY
LALIGA_BACKEND_API_KEY
LALIGA_WEBVIEW_API_KEY
```

## 17. Deployment prerequisites

For GitHub Pages publication via Actions:

- Repository Pages must be enabled.
- Build and deploy should run from GitHub Actions.
- The hourly/manual workflow should publish from the generated artifact.

## 18. Result handling

Not implemented in MVP.

Do not design the current domain model around scores.

Future versions may add result/score fields without changing the event identity model.
