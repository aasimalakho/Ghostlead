import { randomUUID } from "crypto";
import type { Response } from "express";
import { IncomingLead, Lead, LeadQualification } from "../types.js";

const leads = new Map<string, Lead>();
const subscribers = new Set<Response>();

export function createLead(input: IncomingLead): Lead {
  const lead: Lead = {
    ...input,
    id: randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  leads.set(lead.id, lead);
  broadcast();
  return lead;
}

export function markConnecting(id: string, calleCallId: string) {
  const lead = leads.get(id);
  if (!lead) return;
  lead.status = "connecting";
  lead.calleCallId = calleCallId;
  broadcast();
}

export function resolveLead(
  id: string,
  qualification: LeadQualification | undefined,
  transcriptSummary: string | undefined
) {
  const lead = leads.get(id);
  if (!lead) return;
  lead.respondedAt = new Date().toISOString();
  lead.responseTimeSeconds = Math.round(
    (Date.parse(lead.respondedAt) - Date.parse(lead.createdAt)) / 1000
  );
  lead.qualification = qualification;
  lead.transcriptSummary = transcriptSummary;
  lead.status = qualification?.wants_to_proceed === "yes" ? "qualified" : "cold";
  broadcast();
}

export function markError(id: string, reason: string) {
  const lead = leads.get(id);
  if (!lead) return;
  lead.status = "error";
  lead.transcriptSummary = reason;
  broadcast();
}

export function findByCallId(calleCallId: string): Lead | undefined {
  return [...leads.values()].find((l) => l.calleCallId === calleCallId);
}

export function listLeads(): Lead[] {
  return [...leads.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function subscribe(res: Response) {
  subscribers.add(res);
}

export function unsubscribe(res: Response) {
  subscribers.delete(res);
}

function broadcast() {
  const payload = `data: ${JSON.stringify(listLeads())}\n\n`;
  for (const res of subscribers) {
    res.write(payload);
  }
}
