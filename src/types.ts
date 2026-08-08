export type LeadSource = "zillow" | "website_form" | "facebook_ad" | "autotrader" | "referral";

export type LeadStatus =
  | "new"          // just received, not yet called
  | "connecting"   // CALL-E call created, waiting on outcome
  | "qualified"    // structured result came back positive
  | "cold"         // no answer, not interested, or disqualified
  | "error";       // CALL-E call failed outright

export interface IncomingLead {
  name: string;
  phone: string; // E.164, e.g. +14155551234
  source: LeadSource;
  region?: string; // ISO region code CALL-E supports, defaults to "US"
  locale?: string; // defaults to "en-US"
  interest?: string; // free-text: what they inquired about
}

export interface Lead extends IncomingLead {
  id: string;
  status: LeadStatus;
  createdAt: string;
  calleCallId?: string;
  respondedAt?: string;
  responseTimeSeconds?: number;
  qualification?: LeadQualification;
  transcriptSummary?: string;
}

/**
 * This mirrors the result_schema we send to CALL-E in POST /v1/calls.
 * CALL-E validates the model's structured output against this shape
 * before it comes back on the webhook, so this file is the single
 * source of truth for both the outbound schema and inbound parsing.
 */
export interface LeadQualification {
  wants_to_proceed: "yes" | "no" | "unknown";
  timeline: "immediate" | "within_3_months" | "just_browsing" | "unknown";
  financing_in_place: "yes" | "no" | "unknown";
  best_callback_window: string | null;
  notes: string;
}

export const LEAD_QUALIFICATION_SCHEMA = {
  type: "object",
  required: ["wants_to_proceed", "timeline", "financing_in_place"],
  properties: {
    wants_to_proceed: { type: "string", enum: ["yes", "no", "unknown"] },
    timeline: {
      type: "string",
      enum: ["immediate", "within_3_months", "just_browsing", "unknown"],
    },
    financing_in_place: { type: "string", enum: ["yes", "no", "unknown"] },
    best_callback_window: { type: ["string", "null"] },
    notes: { type: "string" },
  },
  additionalProperties: false,
} as const;
