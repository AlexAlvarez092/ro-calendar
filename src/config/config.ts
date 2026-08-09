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

export interface ApiCredentials {
  sharedApiKey?: string;
  backendApiKey?: string;
  webviewApiKey?: string;
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

export function readApiCredentials(): ApiCredentials {
  const legacy = clean(process.env.LALIGA_API_KEY);
  const backend = clean(process.env.LALIGA_BACKEND_API_KEY);
  const webview = clean(process.env.LALIGA_WEBVIEW_API_KEY);

  return {
    sharedApiKey: legacy,
    backendApiKey: backend,
    webviewApiKey: webview,
  };
}

function clean(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
