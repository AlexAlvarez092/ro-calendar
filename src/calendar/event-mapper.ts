import { DateTime } from "luxon";
import type { AppConfig } from "../config/config.js";
import type { CalendarEvent } from "../domain/calendar-event.js";
import type { Match } from "../domain/match.js";

export function buildEventUid(matchId: number): string {
  return `laliga-match-${matchId}@real-oviedo-calendar`;
}

export function toCalendarEvent(match: Match, config: AppConfig): CalendarEvent {
  const homeDisplay = match.homeTeam.nickname ?? match.homeTeam.name;
  const awayDisplay = match.awayTeam.nickname ?? match.awayTeam.name;

  const local = DateTime.fromJSDate(match.date).setZone(config.timezone);
  const start = match.hasConfirmedTime ? local.toJSDate() : local.startOf("day").toJSDate();

  return {
    uid: buildEventUid(match.id),
    title: `${homeDisplay} - ${awayDisplay}`,
    start,
    allDay: !match.hasConfirmedTime,
    location: match.venue ?? undefined,
    description: `Jornada ${match.round}`,
  };
}
