import { describe, expect, it } from "vitest";
import { LaligaClient } from "../src/api/laliga-client.js";
import type { AppConfig } from "../src/config/config.js";

const config: AppConfig = {
  competition: "laliga-hypermotion-2026",
  season: "2026/27",
  competitionSubscriptionId: 396,
  team: { id: 157, name: "Real Oviedo" },
  timezone: "Europe/Madrid",
};

describe("LaligaClient dynamic credentials", () => {
  it("discovers backend and webview keys and uses each one on its endpoint", async () => {
    const calls: Array<{ url: string; key: string | null }> = [];

    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);

      if (
        url === "https://www.laliga.com/" ||
        url === "https://www.laliga.com/resultados"
      ) {
        const html =
          '"backendUrl":"https://apim.laliga.com/public-service","backendSubscription":"backend123","webviewUrl":"https://apim.laliga.com/webview","webviewSubscription":"webview456"';
        return new Response(html, { status: 200 });
      }

      const key =
        (init?.headers as Record<string, string> | undefined)?.[
          "Ocp-Apim-Subscription-Key"
        ] ?? null;

      calls.push({ url, key });

      if (url.includes("/gameweeks")) {
        return new Response(JSON.stringify({ gameweeks: [2] }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ matches: [] }), { status: 200 });
    };

    const client = new LaligaClient({ fetchImpl });
    await client.collectMatches(config);

    expect(calls).toHaveLength(2);

    expect(calls[0]?.url).toContain(
      "https://apim.laliga.com/public-service/api/v1/",
    );
    expect(calls[0]?.key).toBe("backend123");

    expect(calls[1]?.url).toContain("https://apim.laliga.com/webview/api/web/");
    expect(calls[1]?.key).toBe("webview456");
  });

  it("uses explicit environment-style keys when provided", async () => {
    const calls: Array<{ url: string; key: string | null }> = [];

    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);

      if (
        url === "https://www.laliga.com/" ||
        url === "https://www.laliga.com/resultados"
      ) {
        throw new Error(
          "Runtime discovery should not run when both keys are provided.",
        );
      }

      const key =
        (init?.headers as Record<string, string> | undefined)?.[
          "Ocp-Apim-Subscription-Key"
        ] ?? null;

      calls.push({ url, key });

      if (url.includes("/gameweeks")) {
        return new Response(JSON.stringify({ gameweeks: [2] }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ matches: [] }), { status: 200 });
    };

    const client = new LaligaClient({ fetchImpl });
    await client.collectMatches(config, {
      backendApiKey: "env-backend",
      webviewApiKey: "env-webview",
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]?.key).toBe("env-backend");
    expect(calls[1]?.key).toBe("env-webview");
  });

  it("falls back to dynamic discovery when legacy shared key is stale", async () => {
    const calls: Array<{ url: string; key: string | null }> = [];
    let attemptedWithShared = false;

    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);

      if (
        url === "https://www.laliga.com/" ||
        url === "https://www.laliga.com/resultados"
      ) {
        const html =
          '"backendUrl":"https://apim.laliga.com/public-service","backendSubscription":"backend123","webviewUrl":"https://apim.laliga.com/webview","webviewSubscription":"webview456"';
        return new Response(html, { status: 200 });
      }

      const key =
        (init?.headers as Record<string, string> | undefined)?.[
          "Ocp-Apim-Subscription-Key"
        ] ?? null;

      calls.push({ url, key });

      if (
        url.includes("/gameweeks") &&
        key === "stale-shared" &&
        !attemptedWithShared
      ) {
        attemptedWithShared = true;
        return new Response("", { status: 401 });
      }

      if (url.includes("/gameweeks")) {
        return new Response(JSON.stringify({ gameweeks: [2] }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ matches: [] }), { status: 200 });
    };

    const client = new LaligaClient({ fetchImpl });
    await client.collectMatches(config, { sharedApiKey: "stale-shared" });

    expect(calls.some((call) => call.key === "stale-shared")).toBe(true);
    expect(calls.some((call) => call.key === "backend123")).toBe(true);
    expect(calls.some((call) => call.key === "webview456")).toBe(true);
  });
});
