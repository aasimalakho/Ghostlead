import { Router } from "express";
import { findByCallId, markError, resolveLead } from "../store/leadStore";
import { LeadQualification } from "../types";

export const webhookRouter = Router();

/**
 * CALL-E posts here once a call reaches a terminal state (completed,
 * no-answer, failed). This is the "structured results you can act on"
 * half of the integration — we take call.structuredResult straight
 * from CALL-E and use it to route the lead to "qualified" or "cold"
 * without a human touching it.
 *
 * Point CALLE_BASE webhook config / your tunnel (ngrok, ngrok-alternative,
 * or your deploy host) at POST /calle/webhook — see README "Webhooks" section.
 */
webhookRouter.post("/calle/webhook", (req, res) => {
  const event = req.body as {
    call_id?: string;
    status?: string;
    structured_result?: LeadQualification;
    transcript_summary?: string;
    error?: string;
  };

  if (!event.call_id) {
    return res.status(400).json({ error: "missing call_id" });
  }

  const lead = findByCallId(event.call_id);
  if (!lead) {
    // Not necessarily an error — could be a retry or a call from another
    // environment sharing the same CALL-E account. Ack and move on.
    return res.status(202).json({ ok: true, note: "no matching lead" });
  }

  if (event.status === "failed" || event.error) {
    markError(lead.id, event.error ?? "CALL-E reported call failure");
  } else {
    resolveLead(lead.id, event.structured_result, event.transcript_summary);
  }

  res.status(200).json({ ok: true });
});
