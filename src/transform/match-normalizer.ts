import { DateTime } from "luxon";
import type { AppConfig } from "../config/config.js";
import type { Match, Team } from "../domain/match.js";
import type { RawLaligaMatch } from "../api/laliga-types.js";

export function isMatchForTeam(raw: RawLaligaMatch, teamId: number): boolean {
  return raw.home_team?.id === teamId || raw.away_team?.id === teamId;
}

export function hasConfirmedKickoff(raw: RawLaligaMatch): boolean {
  // This rule is intentionally isolated because LALIGA's unconfirmed-time flags can evolve.
  if (!raw.time || typeof raw.time !== "string") {
    return false;
  }

  const dt = DateTime.fromISO(raw.time, { setZone: true });
  return dt.isValid;
}

export function normalizeMatch(raw: RawLaligaMatch, round: string, config: AppConfig): Match | null {
  if (!raw.id || !raw.home_team?.id || !raw.away_team?.id) {
    return null;
  }

  const homeTeam = normalizeTeam(raw.home_team);
  const awayTeam = normalizeTeam(raw.away_team);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const sourceDate = raw.time ?? raw.date;

  if (!sourceDate) {
    return null;
  }

  const date = DateTime.fromISO(sourceDate, { setZone: true }).setZone(config.timezone);

  if (!date.isValid) {
    return null;
  }

  return {
    id: raw.id,
    competition: raw.subscription?.slug ?? config.competition,
    round,
    status: raw.status ?? "unknown",
    date: date.toJSDate(),
    hasConfirmedTime: hasConfirmedKickoff(raw),
    homeTeam,
    awayTeam,
    venue: raw.venue?.name ?? null,
  };
}

function normalizeTeam(rawTeam: RawLaligaMatch["home_team"]): Team | null {
  if (!rawTeam?.id) {
    return null;
  }

  const displayName = rawTeam.nickname ?? rawTeam.name;

  if (!displayName) {
    return null;
  }

  return {
    id: rawTeam.id,
    name: rawTeam.name ?? displayName,
    shortName: rawTeam.shortname,
    nickname: rawTeam.nickname,
  };
}
