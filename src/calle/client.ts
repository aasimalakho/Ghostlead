import { CalleClient } from "@call-e/calle";
import { IncomingLead, Lead, LeadQualification } from "../types.js";

/**
 * Single shared CALL-E client for the whole app.
 *
 * Env vars (see .env.example):
 *   CALLE_API_KEY  — REQUIRED. From dashboard.heycall-e.com/account/api-keys
 *                    (20 free calls on signup).
 *   CALLE_BASE_URL — OPTIONAL. Only set this if CALL-E's dashboard tells you
 *                    to point at a non-default environment. If unset, the
 *                    SDK uses CALL-E's standard production endpoint.
 *
 * We fail loudly on a missing API key instead of silently no-op'ing,
 * because a "GhostLead" that can't actually reach CALL-E isn't GhostLead.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Set it in your .env file locally, ` +
        `or in your host's environment variables when deployed.`
    );
  }
  return value;
}

export function createCalleClient(): CalleClient {
  const baseUrl = process.env.CALLE_BASE_URL; // optional — SDK defaults if unset

  return new CalleClient({
    apiKey: requireEnv("CALLE_API_KEY"),
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export const calle = createCalleClient();
