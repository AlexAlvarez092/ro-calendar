import type { AppConfig } from "../config/config.js";
import type { RawLaligaMatch, RawLaligaMatchesResponse } from "./laliga-types.js";

const GAMEWEEKS_BASE_URL = "https://apim.laliga.com/public-service/api/v1";
const MATCHES_BASE_URL = "https://apim.laliga.com/webview/api/web";

export type FetchLike = typeof fetch;

interface ClientOptions {
  fetchImpl?: FetchLike;
}

export class LaligaClient {
  private readonly fetchImpl: FetchLike;

  constructor(options: ClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async collectMatches(config: AppConfig, apiKey: string): Promise<RawLaligaMatch[]> {
    const weeks = await this.fetchGameweeks(config.competition, apiKey);

    const allMatches: RawLaligaMatch[] = [];

    for (const week of weeks) {
      const weekMatches = await this.fetchMatchesByWeek(config.competition, week, apiKey);
      allMatches.push(...weekMatches);
    }

    return allMatches;
  }

  async fetchGameweeks(competitionSlug: string, apiKey: string): Promise<string[]> {
    const response = await this.fetchWithKey(
      `${GAMEWEEKS_BASE_URL}/subscriptions/${competitionSlug}/gameweeks?contentLanguage=es&subscription-key=${encodeURIComponent(apiKey)}`,
      apiKey,
    );

    const payload = (await response.json()) as unknown;
    const weeks = extractWeeks(payload);

    if (weeks.length === 0) {
      throw new Error("No gameweeks found in API response.");
    }

    return weeks;
  }

  async fetchMatchesByWeek(competitionSlug: string, week: string, apiKey: string): Promise<RawLaligaMatch[]> {
    const response = await this.fetchWithKey(
      `${MATCHES_BASE_URL}/subscriptions/${competitionSlug}/week/${encodeURIComponent(week)}/matches?contentLanguage=es&subscription-key=${encodeURIComponent(apiKey)}`,
      apiKey,
    );

    const payload = (await response.json()) as RawLaligaMatchesResponse;

    if (!payload || !Array.isArray(payload.matches)) {
      throw new Error(`Invalid matches response for week ${week}.`);
    }

    return payload.matches;
  }

  private async fetchWithKey(url: string, apiKey: string): Promise<Response> {
    const response = await this.fetchImpl(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`LALIGA API request failed with status ${response.status}.`);
    }

    return response;
  }
}

function extractWeeks(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidateArrays = [
    (payload as { gameweeks?: unknown }).gameweeks,
    (payload as { weeks?: unknown }).weeks,
    (payload as { rounds?: unknown }).rounds,
  ];

  for (const candidate of candidateArrays) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const weeks = candidate
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const mapped = (item as { week?: unknown; id?: unknown; slug?: unknown }).week
          ?? (item as { id?: unknown }).id
          ?? (item as { slug?: unknown }).slug;

        if (typeof mapped === "string" || typeof mapped === "number") {
          return String(mapped);
        }

        return null;
      })
      .filter((value): value is string => Boolean(value));

    if (weeks.length > 0) {
      return weeks;
    }
  }

  return [];
}
