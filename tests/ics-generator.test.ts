import { describe, expect, it } from "vitest";
import type { AppConfig } from "../src/config/config.js";
import type { Match } from "../src/domain/match.js";
import { toCalendarEvent, buildEventUid } from "../src/calendar/event-mapper.js";
import { generateCalendarIcs } from "../src/calendar/ics-generator.js";
import { validateCalendarIcs } from "../src/validation/calendar-validator.js";

const config: AppConfig = {
  competition: "laliga-hypermotion-2026",
  season: "2026/27",
  competitionSubscriptionId: 396,
  team: { id: 157, name: "Real Oviedo" },
  timezone: "Europe/Madrid",
};

function createMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 102648,
    competition: "laliga-hypermotion-2026",
    round: "2",
    status: "PreMatch",
    date: new Date("2026-08-22T15:00:00.000Z"),
    hasConfirmedTime: true,
    homeTeam: { id: 157, name: "Real Oviedo SAD", nickname: "Real Oviedo" },
    awayTeam: { id: 54, name: "CD Leganes", nickname: "CD Leganes" },
    venue: "Estadio Carlos Tartiere",
    ...overrides,
  };
}

describe("event mapping and ICS generation", () => {
  it("creates timed event with title, location and jornada", () => {
    const event = toCalendarEvent(createMatch(), config);
    const ics = generateCalendarIcs([event], config);

    expect(event.title).toBe("Real Oviedo - CD Leganes");
    expect(event.location).toBe("Estadio Carlos Tartiere");
    expect(event.description).toBe("Jornada 2");
    expect(event.allDay).toBe(false);

    validateCalendarIcs(ics, [event]);
    expect(ics).toContain("TZID=Europe/Madrid");
  });

  it("creates birthday-style all-day event when time is unconfirmed", () => {
    const match = createMatch({ hasConfirmedTime: false });
    const event = toCalendarEvent(match, config);
    const ics = generateCalendarIcs([event], config);

    expect(event.allDay).toBe(true);
    validateCalendarIcs(ics, [event]);
    expect(ics).toContain("DTSTART;VALUE=DATE");
  });

  it("keeps UID stable when fixture details change", () => {
    const baseUid = buildEventUid(102648);

    const event1 = toCalendarEvent(createMatch({ date: new Date("2026-08-22T15:00:00.000Z") }), config);
    const event2 = toCalendarEvent(
      createMatch({ date: new Date("2026-08-23T18:00:00.000Z"), venue: "Nuevo Tartiere" }),
      config,
    );

    expect(event1.uid).toBe(baseUid);
    expect(event2.uid).toBe(baseUid);
    expect(event1.start.getTime()).not.toBe(event2.start.getTime());
    expect(event1.location).not.toBe(event2.location);
  });
});
