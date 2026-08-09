import { describe, expect, it } from "vitest";
import { normalizeMatch, isMatchForTeam } from "../src/transform/match-normalizer.js";
import type { AppConfig } from "../src/config/config.js";
import type { RawLaligaMatch } from "../src/api/laliga-types.js";

const config: AppConfig = {
  competition: "laliga-hypermotion-2026",
  season: "2026/27",
  competitionSubscriptionId: 396,
  team: { id: 157, name: "Real Oviedo" },
  timezone: "Europe/Madrid",
};

function baseRaw(): RawLaligaMatch {
  return {
    id: 102648,
    name: "Temporada 2026/2027 - LALIGA HYPERMOTION - Real Oviedo - CD Leganes - 2",
    date: "2026-08-22T15:00:00+00:00",
    time: "2026-08-22T15:00:00+00:00",
    status: "PreMatch",
    home_team: { id: 157, name: "Real Oviedo SAD", nickname: "Real Oviedo", shortname: "OVI" },
    away_team: { id: 54, name: "CD Leganes", nickname: "CD Leganes", shortname: "LEG" },
    venue: { name: "Estadio Carlos Tartiere" },
    subscription: { id: 396, slug: "laliga-hypermotion-2026" },
  };
}

describe("team filtering", () => {
  it("includes home fixtures for configured team", () => {
    expect(isMatchForTeam(baseRaw(), 157)).toBe(true);
  });

  it("includes away fixtures for configured team", () => {
    const raw = baseRaw();
    raw.home_team = { id: 3, name: "Other" };
    raw.away_team = { id: 157, name: "Real Oviedo", nickname: "Real Oviedo" };

    expect(isMatchForTeam(raw, 157)).toBe(true);
  });

  it("excludes unrelated fixtures", () => {
    const raw = baseRaw();
    raw.home_team = { id: 7, name: "A" };
    raw.away_team = { id: 8, name: "B" };

    expect(isMatchForTeam(raw, 157)).toBe(false);
  });
});

describe("normalization", () => {
  it("maps source match to internal model", () => {
    const normalized = normalizeMatch(baseRaw(), "2", config);

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe(102648);
    expect(normalized?.round).toBe("2");
    expect(normalized?.homeTeam.nickname).toBe("Real Oviedo");
    expect(normalized?.venue).toBe("Estadio Carlos Tartiere");
  });

  it("sets hasConfirmedTime false when kickoff is unconfirmed", () => {
    const raw = baseRaw();
    raw.time = undefined;
    raw.date = "2026-08-22T00:00:00+00:00";

    const normalized = normalizeMatch(raw, "2", config);

    expect(normalized).not.toBeNull();
    expect(normalized?.hasConfirmedTime).toBe(false);
  });

  it("skips match with missing minimum required fields", () => {
    const raw = baseRaw();
    raw.id = undefined;

    const normalized = normalizeMatch(raw, "2", config);

    expect(normalized).toBeNull();
  });
});
