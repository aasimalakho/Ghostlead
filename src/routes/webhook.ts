import { Router } from "express";
import { findByCallId, markError, resolveLead } from "../store/leadStore.js";
import { LeadQualification } from "../types.js";

export const webhookRouter = Router();

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
    return res.status(202).json({ ok: true, note: "no matching lead" });
  }

  if (event.status === "failed" || event.error) {
    markError(lead.id, event.error ?? "CALL-E reported call failure");
  } else {
    resolveLead(lead.id, event.structured_result, event.transcript_summary);
  }

  res.status(200).json({ ok: true });
});
