import { Router } from "express";
import { qualifyLeadByCall } from "../calle/qualifyLead.js";
import { createLead, listLeads, markConnecting, markError, subscribe, unsubscribe } from "../store/leadStore.js";
import { IncomingLead } from "../types.js";

export const leadsRouter = Router();

leadsRouter.post("/leads", async (req, res) => {
  const body = req.body as Partial<IncomingLead>;

  if (!body.name || !body.phone || !body.source) {
    return res.status(400).json({ error: "name, phone, and source are required" });
  }

  const lead = createLead({
    name: body.name,
    phone: body.phone,
    source: body.source as IncomingLead["source"],
    region: body.region,
    locale: body.locale,
    interest: body.interest,
  });

  res.status(202).json({ lead });

  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  try {
    const call = await qualifyLeadByCall(lead, `${publicBaseUrl}/calle/webhook`);
    markConnecting(lead.id, call.id);
  } catch (err) {
    markError(lead.id, err instanceof Error ? err.message : "CALL-E call failed to start");
  }
});

leadsRouter.get("/leads", (_req, res) => {
  res.json({ leads: listLeads() });
});

leadsRouter.get("/leads/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(`data: ${JSON.stringify(listLeads())}\n\n`);
  subscribe(res);
  req.on("close", () => unsubscribe(res));
});
