import { CalleClient } from "@call-e/calle";

/**
 * Single shared CALL-E client for the whole app.
 *
 * Required env vars (see .env.example):
 *   CALLE_API_KEY  — from your CALL-E account (20 free calls on signup)
 *   CALLE_BASE_URL — from your CALL-E beta onboarding / SDK docs
 *
 * We fail loudly at startup instead of silently no-op'ing, because a
 * "GhostLead" that can't actually reach CALL-E isn't GhostLead.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in ` +
        `with your CALL-E credentials before starting the server.`
    );
  }
  return value;
}

export function createCalleClient(): CalleClient {
  return new CalleClient({
    apiKey: requireEnv("CALLE_API_KEY"),
    baseUrl: requireEnv("CALLE_BASE_URL"),
  });
}

export const calle = createCalleClient();
