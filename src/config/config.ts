import { readFile } from "node:fs/promises";

export interface AppConfig {
  competition: string;
  season: string;
  competitionSubscriptionId: number;
  team: {
    id: number;
    name: string;
  };
  timezone: string;
}

export async function loadConfig(path: string): Promise<AppConfig> {
  const raw = await readFile(path, "utf-8");
  const parsed = JSON.parse(raw) as AppConfig;

  if (!parsed.competition || !parsed.season || !parsed.timezone) {
    throw new Error("Configuration is missing required fields.");
  }

  if (!parsed.team || typeof parsed.team.id !== "number" || !parsed.team.name) {
    throw new Error("Configuration team is invalid.");
  }

  return parsed;
}

export function readApiKey(): string {
  const value = process.env.LALIGA_API_KEY;

  if (!value) {
    throw new Error("LALIGA_API_KEY is required.");
  }

  return value;
}
