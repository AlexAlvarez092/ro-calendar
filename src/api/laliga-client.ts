import type { ApiCredentials, AppConfig } from "../config/config.js";
import type {
  RawLaligaMatch,
  RawLaligaMatchesResponse,
} from "./laliga-types.js";

const DEFAULT_BACKEND_BASE_URL = "https://apim.laliga.com/public-service";
const DEFAULT_WEBVIEW_BASE_URL = "https://apim.laliga.com/webview";
const RUNTIME_CONFIG_SOURCE_URLS = [
  "https://www.laliga.com/",
  "https://www.laliga.com/resultados",
];

export type FetchLike = typeof fetch;

interface ResolvedApiCredentials {
  backendApiKey: string;
  webviewApiKey: string;
  backendBaseUrl: string;
  webviewBaseUrl: string;
}

interface RuntimeApiConfig {
  backendUrl: string;
  backendSubscription: string;
  webviewUrl: string;
  webviewSubscription: string;
}

interface ClientOptions {
  fetchImpl?: FetchLike;
}

export class LaligaClient {
  private readonly fetchImpl: FetchLike;

  constructor(options: ClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async collectMatches(
    config: AppConfig,
    credentials: ApiCredentials = {},
  ): Promise<RawLaligaMatch[]> {
    const resolved = await this.resolveCredentials(credentials);

    try {
      return await this.collectMatchesWithResolved(config, resolved);
    } catch (error) {
      if (!isUnauthorized(error) || !credentials.sharedApiKey) {
        throw error;
      }

      const fallback = await this.resolveCredentials({});
      return this.collectMatchesWithResolved(config, fallback);
    }
  }

  private async collectMatchesWithResolved(
    config: AppConfig,
    resolved: ResolvedApiCredentials,
  ): Promise<RawLaligaMatch[]> {
    const weeks = await this.fetchGameweeks(
      config.competition,
      resolved.backendApiKey,
      resolved.backendBaseUrl,
    );

    const allMatches: RawLaligaMatch[] = [];

    for (const week of weeks) {
      const weekMatches = await this.fetchMatchesByWeek(
        config.competition,
        week,
        resolved.webviewApiKey,
        resolved.webviewBaseUrl,
      );
      allMatches.push(...weekMatches);
    }

    return allMatches;
  }

  async fetchGameweeks(
    competitionSlug: string,
    apiKey: string,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ): Promise<string[]> {
    const response = await this.fetchWithKey(
      `${backendBaseUrl}/api/v1/subscriptions/${competitionSlug}/gameweeks?contentLanguage=es&subscription-key=${encodeURIComponent(apiKey)}`,
      apiKey,
    );

    const payload = (await response.json()) as unknown;
    const weeks = extractWeeks(payload);

    if (weeks.length === 0) {
      throw new Error("No gameweeks found in API response.");
    }

    return weeks;
  }

  async fetchMatchesByWeek(
    competitionSlug: string,
    week: string,
    apiKey: string,
    webviewBaseUrl = DEFAULT_WEBVIEW_BASE_URL,
  ): Promise<RawLaligaMatch[]> {
    const response = await this.fetchWithKey(
      `${webviewBaseUrl}/api/web/subscriptions/${competitionSlug}/week/${encodeURIComponent(week)}/matches?contentLanguage=es&subscription-key=${encodeURIComponent(apiKey)}`,
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
      throw new Error(
        `LALIGA API request failed with status ${response.status}.`,
      );
    }

    return response;
  }

  private async resolveCredentials(
    credentials: ApiCredentials,
  ): Promise<ResolvedApiCredentials> {
    const backend = credentials.backendApiKey ?? credentials.sharedApiKey;
    const webview = credentials.webviewApiKey ?? credentials.sharedApiKey;

    if (backend && webview) {
      return {
        backendApiKey: backend,
        webviewApiKey: webview,
        backendBaseUrl: DEFAULT_BACKEND_BASE_URL,
        webviewBaseUrl: DEFAULT_WEBVIEW_BASE_URL,
      };
    }

    const discovered = await this.discoverRuntimeApiConfig();

    return {
      backendApiKey:
        credentials.backendApiKey ?? discovered.backendSubscription,
      webviewApiKey:
        credentials.webviewApiKey ?? discovered.webviewSubscription,
      backendBaseUrl: discovered.backendUrl || DEFAULT_BACKEND_BASE_URL,
      webviewBaseUrl: discovered.webviewUrl || DEFAULT_WEBVIEW_BASE_URL,
    };
  }

  private async discoverRuntimeApiConfig(): Promise<RuntimeApiConfig> {
    for (const sourceUrl of RUNTIME_CONFIG_SOURCE_URLS) {
      const response = await this.fetchImpl(sourceUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const parsed = parseRuntimeApiConfig(html);

      if (parsed) {
        return parsed;
      }
    }

    throw new Error("Unable to discover dynamic LALIGA API credentials.");
  }
}

function parseRuntimeApiConfig(html: string): RuntimeApiConfig | null {
  const backendUrl = extractOptional(html, /backendUrl":"([^"]+)"/);
  const backendSubscription = extractOptional(
    html,
    /backendSubscription":"([a-z0-9]+)"/i,
  );
  const webviewUrl = extractOptional(html, /webviewUrl":"([^"]+)"/);
  const webviewSubscription = extractOptional(
    html,
    /webviewSubscription":"([a-z0-9]+)"/i,
  );

  if (
    !backendUrl ||
    !backendSubscription ||
    !webviewUrl ||
    !webviewSubscription
  ) {
    return null;
  }

  return {
    backendUrl,
    backendSubscription,
    webviewUrl,
    webviewSubscription,
  };
}

function extractOptional(input: string, pattern: RegExp): string | null {
  const match = input.match(pattern);
  return match?.[1] ?? null;
}

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /status 401/.test(error.message);
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

        const mapped =
          (item as { week?: unknown; id?: unknown; slug?: unknown }).week ??
          (item as { id?: unknown }).id ??
          (item as { slug?: unknown }).slug;

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
