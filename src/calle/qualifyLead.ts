import { calle } from "./client.js";
import { Lead, LEAD_QUALIFICATION_SCHEMA } from "../types.js";

export async function qualifyLeadByCall(lead: Lead, webhookUrl: string) {
  const task = buildTask(lead);

  const call = await calle.calls.createAndWait(
    {
      task,
      recipient: {
        phone: lead.phone,
        region: lead.region ?? "US",
        locale: lead.locale ?? "en-US",
      },
      resultSchema: LEAD_QUALIFICATION_SCHEMA,
      metadata: {
        lead_id: lead.id,
        source: lead.source,
        workflow: "ghostlead_new_lead_response",
      },
      webhookUrl,
    },
    { idempotencyKey: `ghostlead_${lead.id}` }
  );

  return call;
}

function buildTask(lead: Lead): string {
  const interest = lead.interest ? ` about "${lead.interest}"` : "";
  return [
    `Call ${lead.name}, who just submitted an inquiry${interest} via ${humanSource(lead.source)}.`,
    `Introduce yourself as calling on behalf of the team they contacted, thank them for reaching out,`,
    `and ask three things conversationally, one at a time: (1) whether they'd still like to proceed,`,
    `(2) their rough timeline, and (3) whether financing/pre-approval is already in place.`,
    `Keep the call under 90 seconds. Be warm, not scripted. If they're not interested, thank them and end the call politely.`,
    `If they don't answer, do not leave a lengthy voicemail — a short one is fine.`,
  ].join(" ");
}

function humanSource(source: Lead["source"]): string {
  const map: Record<Lead["source"], string> = {
    zillow: "Zillow",
    website_form: "our website",
    facebook_ad: "a Facebook ad",
    autotrader: "Autotrader",
    referral: "a referral",
  };
  return map[source] ?? source;
}
