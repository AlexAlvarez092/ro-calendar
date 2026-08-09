import { mkdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { LaligaClient } from "../api/laliga-client.js";
import type { RawLaligaMatch } from "../api/laliga-types.js";
import type { ApiCredentials, AppConfig } from "../config/config.js";
import { loadConfig, readApiCredentials } from "../config/config.js";
import type { CalendarEvent } from "../domain/calendar-event.js";
import type { Match } from "../domain/match.js";
import { toCalendarEvent } from "../calendar/event-mapper.js";
import { generateCalendarIcs } from "../calendar/ics-generator.js";
import {
  normalizeMatch,
  isMatchForTeam,
} from "../transform/match-normalizer.js";
import { validateCalendarIcs } from "../validation/calendar-validator.js";

interface PipelineDependencies {
  collectMatches?: (
    config: AppConfig,
    credentials: ApiCredentials,
  ) => Promise<RawLaligaMatch[]>;
  normalize?: (
    raw: RawLaligaMatch,
    round: string,
    config: AppConfig,
  ) => Match | null;
  mapEvent?: (match: Match, config: AppConfig) => CalendarEvent;
  generateIcs?: (events: CalendarEvent[], config: AppConfig) => string;
  validateIcs?: (ics: string, events: CalendarEvent[]) => void;
}

export interface GenerateCalendarOptions {
  configPath?: string;
  outputPath?: string;
  dependencies?: PipelineDependencies;
}

export async function generateCalendar(
  options: GenerateCalendarOptions = {},
): Promise<void> {
  const configPath = options.configPath ?? "config/config.json";
  const outputPath = options.outputPath ?? "public/calendar.ics";
  const dependencies = options.dependencies ?? {};

  const config = await loadConfig(configPath);
  const credentials = readApiCredentials();

  const collector = dependencies.collectMatches ?? defaultCollectMatches;
  const normalize = dependencies.normalize ?? normalizeMatch;
  const mapEvent = dependencies.mapEvent ?? toCalendarEvent;
  const generateIcs = dependencies.generateIcs ?? generateCalendarIcs;
  const validateIcs = dependencies.validateIcs ?? validateCalendarIcs;

  const rawMatches = await collector(config, credentials);
  const filtered = rawMatches.filter((raw) =>
    isMatchForTeam(raw, config.team.id),
  );

  const normalized = filtered
    .map((raw) => normalize(raw, readRound(raw), config))
    .filter((match): match is Match => Boolean(match));

  if (normalized.length === 0) {
    throw new Error(
      "No fixtures generated after filtering/normalization. Existing calendar is preserved.",
    );
  }

  const events = normalized.map((match) => mapEvent(match, config));
  const ics = generateIcs(events, config);

  validateIcs(ics, events);

  await writeSafely(outputPath, ics);
}

async function defaultCollectMatches(
  config: AppConfig,
  credentials: ApiCredentials,
): Promise<RawLaligaMatch[]> {
  const client = new LaligaClient();
  return client.collectMatches(config, credentials);
}

function readRound(raw: RawLaligaMatch): string {
  const fromName = raw.name?.split(" - ").at(-1)?.trim();
  if (fromName && /^\d+$/.test(fromName)) {
    return fromName;
  }

  return "?";
}

async function writeSafely(outputPath: string, content: string): Promise<void> {
  const folder = dirname(outputPath);
  await mkdir(folder, { recursive: true });

  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, content, "utf-8");

  if (!existsSync(tempPath)) {
    throw new Error("Temporary calendar file was not created.");
  }

  await rename(tempPath, outputPath);
}
