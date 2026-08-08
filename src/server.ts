import "dotenv/config";
import cors from "cors";
import express from "express";
import { leadsRouter } from "./routes/leads.js";
import { webhookRouter } from "./routes/webhook.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", leadsRouter);
app.use(webhookRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`GhostLead API listening on http://localhost:${port}`);
  console.log(`POST a lead:      curl -X POST http://localhost:${port}/api/leads -H "Content-Type: application/json" -d @examples/sample-lead.json`);
  console.log(`Watch it live:    curl http://localhost:${port}/api/leads/stream`);
});
