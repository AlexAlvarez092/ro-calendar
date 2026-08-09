import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { generateCalendar } from "../src/pipeline/generate-calendar.js";
import type { RawLaligaMatch } from "../src/api/laliga-types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function setupTempProject(): Promise<{ configPath: string; outputPath: string }> {
  const dir = await mkdtemp(join(tmpdir(), "ro-calendar-test-"));
  tempDirs.push(dir);

  const configDir = join(dir, "config");
  const publicDir = join(dir, "public");

  await mkdir(configDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });

  const configPath = join(configDir, "config.json");
  const outputPath = join(publicDir, "calendar.ics");

  await writeFile(
    configPath,
    JSON.stringify(
      {
        competition: "laliga-hypermotion-2026",
        season: "2026/27",
        competitionSubscriptionId: 396,
        team: { id: 157, name: "Real Oviedo" },
        timezone: "Europe/Madrid",
      },
      null,
      2,
    ),
    "utf-8",
  );

  process.env.LALIGA_API_KEY = "test-key";

  return { configPath, outputPath };
}

function oneFixture(): RawLaligaMatch[] {
  return [
    {
      id: 102648,
      name: "Season - League - Real Oviedo - CD Leganes - 2",
      date: "2026-08-22T15:00:00+00:00",
      time: "2026-08-22T15:00:00+00:00",
      status: "PreMatch",
      home_team: { id: 157, name: "Real Oviedo SAD", nickname: "Real Oviedo" },
      away_team: { id: 54, name: "CD Leganes", nickname: "CD Leganes" },
      venue: { name: "Estadio Carlos Tartiere" },
      subscription: { id: 396, slug: "laliga-hypermotion-2026" },
    },
  ];
}

describe("generation pipeline", () => {
  it("writes calendar when API data is valid", async () => {
    const { configPath, outputPath } = await setupTempProject();

    await generateCalendar({
      configPath,
      outputPath,
      dependencies: {
        collectMatches: async () => oneFixture(),
      },
    });

    const content = await readFile(outputPath, "utf-8");
    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("UID:laliga-match-102648@real-oviedo-calendar");
  });

  it("does not replace existing calendar on API failure", async () => {
    const { configPath, outputPath } = await setupTempProject();

    await writeFile(outputPath, "OLD-CALENDAR", "utf-8");

    await expect(
      generateCalendar({
        configPath,
        outputPath,
        dependencies: {
          collectMatches: async () => {
            throw new Error("API down");
          },
        },
      }),
    ).rejects.toThrow("API down");

    const content = await readFile(outputPath, "utf-8");
    expect(content).toBe("OLD-CALENDAR");
  });

  it("does not replace existing calendar on invalid generated ICS", async () => {
    const { configPath, outputPath } = await setupTempProject();

    await writeFile(outputPath, "OLD-CALENDAR", "utf-8");

    await expect(
      generateCalendar({
        configPath,
        outputPath,
        dependencies: {
          collectMatches: async () => oneFixture(),
          generateIcs: () => "BEGIN:VCALENDAR\nBROKEN\nEND:VCALENDAR",
        },
      }),
    ).rejects.toThrow();

    const content = await readFile(outputPath, "utf-8");
    expect(content).toBe("OLD-CALENDAR");
  });

  it("fails closed on unexpected empty result and does not create new calendar", async () => {
    const { configPath, outputPath } = await setupTempProject();

    await expect(
      generateCalendar({
        configPath,
        outputPath,
        dependencies: {
          collectMatches: async () => [],
        },
      }),
    ).rejects.toThrow("No fixtures generated");

    expect(existsSync(outputPath)).toBe(false);
  });

  it("generated calendar only contains fixtures present in current source", async () => {
    const { configPath, outputPath } = await setupTempProject();

    const twoFixtures = [
      ...oneFixture(),
      {
        ...oneFixture()[0],
        id: 202000,
        name: "Season - League - Team A - Team B - 3",
      },
    ];

    await generateCalendar({
      configPath,
      outputPath,
      dependencies: {
        collectMatches: async () => twoFixtures,
      },
    });

    await generateCalendar({
      configPath,
      outputPath,
      dependencies: {
        collectMatches: async () => oneFixture(),
      },
    });

    const content = await readFile(outputPath, "utf-8");
    expect(content).toContain("UID:laliga-match-102648@real-oviedo-calendar");
    expect(content).not.toContain("UID:laliga-match-202000@real-oviedo-calendar");
  });
});
