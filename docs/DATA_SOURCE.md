# Data Source Discovery

## Source

The project uses the public LALIGA web application's match API as its initial source of truth.

No LALIGA user account/login was required during discovery.

The public site sends an `Ocp-Apim-Subscription-Key` header with API requests. This appears to be an application/API subscription credential used by the public web application, not a personal user credential.

The actual key must not be stored in this repository.

## Competition configuration discovered

From the public global configuration:

```json
{
  "primera-division": {
    "subscription_id": "395",
    "filters": "2026",
    "results": "2026"
  },
  "segunda-division": {
    "subscription_id": "396",
    "filters": "2026",
    "results": "2026"
  }
}
```

For the MVP:

```text
competition slug: laliga-hypermotion-2026
subscription id: 396
team id: 157
team: Real Oviedo
```

## Match endpoint behaviour

Based on browser network captures, the site uses these endpoint patterns:

```text
GET https://apim.laliga.com/public-service/api/v1/subscriptions/{competitionSlug}/gameweeks?contentLanguage=es&subscription-key={key}
GET https://apim.laliga.com/webview/api/web/subscriptions/{competitionSlug}/week/{week}/matches?contentLanguage=es&subscription-key={key}
```

Notes:

- `competitionSlug` for MVP: `laliga-hypermotion-2026`
- `week` comes from the gameweeks response and should not be hard-coded.
- The key appears both as query parameter (`subscription-key`) and request header (`Ocp-Apim-Subscription-Key`) in browser traffic.
- Never store or log the real key.

The discovered match response has a top-level:

```json
{
  "matches": []
}
```

Each match includes:

- `id`
- `name`
- `slug`
- `date`
- `time`
- `status`
- `home_team`
- `away_team`
- `venue`
- `subscription`

Team objects include stable numeric IDs.

## Example confirmed fixture

The discovered second-round response included:

```text
Match ID: 102648
Real Oviedo - CD Leganés
Date: 2026-08-22T15:00:00+00:00
Status: PreMatch
Venue: Estadio Carlos Tartiere
Competition subscription: 396
```

## Gameweeks

The web application exposes gameweek/round information and requests matches by selected week.

The collector should use the site's gameweek information rather than hard-code only the regular-season rounds.

Playoff rounds must be included when exposed by the configured competition.

## Timezone

The API returns ISO timestamps with offsets. The application must convert/represent them in:

```text
Europe/Madrid
```

## Unconfirmed schedules

The exact API representation of a fixture whose date is known but exact time is unconfirmed was not available during pre-season discovery.

Therefore the implementation must isolate this parsing rule and make it easy to update once a real example appears.

## API key dependency

The key is an external dependency controlled by LALIGA.

It may be rotated, invalidated, or otherwise changed by LALIGA.

The implementation must therefore:

- read it from an environment variable/secret;
- never commit it;
- fail safely if unavailable.

Do not assume that the current key will remain valid forever.

## Source-data philosophy

LALIGA is the source of truth for the current fixture list.

The project intentionally does not maintain a second authoritative database.

Every successful generation reconstructs the calendar from current API data.
