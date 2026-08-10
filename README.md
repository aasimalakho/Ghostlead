# GhostLead

> **Leads go cold fast. GhostLead calls them before they do.**

Real estate agents, auto dealerships, and other high-ticket sellers lose deals not
because the lead wasn't interested — but because nobody called back fast enough. By the
time a human rep gets to a new inquiry, the lead has already moved on.

GhostLead calls a new lead **within seconds** of them submitting a form, has a real
phone conversation with them using [CALL-E](https://www.heycall-e.com/), and only hands
the lead to a human rep once it's confirmed they're actually interested — with their
timeline and financing status already captured.

Built for the **CALL-E: Your Code Is Calling** hackathon.

---

## 🎬 Demo

- **Live Dashboard:** https://ghostlead-xujm.onrender.com
- **Backend API:** https://ghostlead-api.onrender.com
- **Repo:** https://github.com/aasimalakho/Ghostlead
- **Demo Video:** _add link once recorded_

---

## ⚡ Watch a Lead Get Called Before It Goes Cold

```
Lead submits a form
        |
POST /api/leads — GhostLead receives it instantly
        |
qualifyLeadByCall() asks CALL-E to place a real outbound call
        |
CALL-E dials, talks, adapts in real time — not a script read aloud
        |
CALL-E returns a structured result: proceed? timeline? financing in place?
        |
Result is also POSTed to /calle/webhook for async delivery
        |
Lead flips to Qualified or Ghosted — live, over Server-Sent Events
        |
A human rep only ever sees leads that are already worth their time
```

No step is faked. `qualifyLeadByCall` genuinely imports and calls the CALL-E SDK
(`@call-e/calle`, `calls.createAndWait`) at runtime — this is a real phone call, not a
simulation.

---

## ✨ What Makes GhostLead Different

### It calls, it doesn't queue
Most lead-response tools file a lead into a CRM and hope a human gets to it soon.
GhostLead picks up the phone itself, immediately.

### It's a real conversation, not a script
CALL-E adapts to what the lead actually says, in real time — the transcript summary
and structured qualification data reflect a genuine back-and-forth, not a fixed IVR tree.

### It only escalates real interest
A human rep never has to sift through cold leads. GhostLead only marks a lead
`qualified` once CALL-E has confirmed intent, timeline, and financing status on the
call itself.

### Built for the leads that actually convert
GhostLead is scoped for real estate and auto dealership leads specifically — the exact
qualifying questions CALL-E asks (timeline, financing/pre-approval in place) match how
those deals actually get won or lost.

---

## 🧠 How It Works

| Component | Responsibility |
|---|---|
| 📥 Lead Intake (`src/routes/leads.ts`) | Validates and accepts new leads via `POST /api/leads` |
| 📞 CALL-E Qualifier (`src/calle/qualifyLead.ts`) | Builds the call task and asks CALL-E to place and hold the qualifying call |
| 🪝 Webhook Receiver (`src/routes/webhook.ts`) | Accepts CALL-E's async terminal result via `POST /calle/webhook` |
| 🗂️ Live Store (`src/store/`) | Holds lead state in memory and broadcasts every change |
| 📡 SSE Stream (`GET /api/leads/stream`) | Pushes live updates to the dashboard the instant a lead's status changes |
| 🖥️ Dashboard (`web/`) | React console showing incoming leads, the active call, and qualification results in real time |

---

## 🔗 CALL-E Integration

Every outbound call goes through one place — `qualifyLeadByCall`
(`src/calle/qualifyLead.ts`) — which uses the official `@call-e/calle` SDK's
`calls.createAndWait` to place a real call and wait for a structured result.

**What CALL-E is asked to do:** introduce itself based on the lead's source (website
form, Zillow, Facebook ad, Autotrader, referral), confirm interest, and ask about
timeline and financing/pre-approval — all conversationally, under 90 seconds, per the
task prompt built in `qualifyLead.ts`.

**What comes back:** a structured result validated against the schema in
`src/types.ts` (`wants_to_proceed`, `timeline`, `financing_in_place`, plus a transcript
summary), delivered either directly from `createAndWait` or asynchronously via the
`/calle/webhook` receiver.

There is no demo/mock mode — `src/calle/client.ts` throws a clear startup error if
`CALLE_API_KEY` isn't set, so every call this project makes is a real one.

---

## 🚀 Features

- ⚡ Calls a new lead within seconds of submission — no queue, no human delay
- 📞 Real CALL-E phone conversation, not a chatbot or IVR tree
- 🧾 Structured qualification output: intent, timeline, financing status
- 🪝 Async webhook delivery for terminal call results
- 📡 Live dashboard over Server-Sent Events — no polling, no refresh needed
- 🧪 Built-in "Send test lead" form in the dashboard — hits the real `/api/leads`
  endpoint directly, no curl required
- 🎯 Scoped to a real vertical (real estate & auto leads), not a generic concept
- 🐳 Optional Docker/Compose setup for the backend

---

## 🛠 Tech Stack

- **Backend:** Express + TypeScript, `@call-e/calle` SDK
- **Frontend:** Vite + React + Tailwind CSS
- **Realtime:** Server-Sent Events (native, no extra dependency)
- **Deployment:** Render (Web Service for the API, Static Site for the dashboard)
- **Dev environment:** GitHub Codespaces-ready

---

## 📁 Repository Layout

```
ghostlead/
├── src/                    Backend (Express + TypeScript)
│   ├── calle/               CALL-E SDK client + call-building logic
│   ├── routes/               /api/leads intake + /calle/webhook receiver
│   ├── store/                 in-memory lead store + live SSE broadcast
│   └── server.ts
├── web/                     Frontend dashboard (Vite + React + Tailwind)
├── examples/                Sample lead payload for testing
├── scripts/                  Convenience seed script
├── docs/SUBMISSION.md        Hackathon submission checklist
├── Dockerfile / docker-compose.yml
└── .env.example
```

---

## 🚀 Getting Started

**1. Get a CALL-E API key** — this is the whole point of the project, so it's required,
not optional. Follow the install guide at
<https://github.com/CALLE-AI/call-e-integrations>; new accounts get 20 free calls.

**2. Configure**
```bash
cp .env.example .env
```
```
CALLE_API_KEY=your_key_here
CALLE_BASE_URL=your_base_url_here
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
```

**3. Run the backend**
```bash
npm install
npm run dev
```

**4. Run the dashboard** (second terminal)
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173`.

**5. Send a real lead through CALL-E** — either use the **"Send test lead"** form
directly in the dashboard, or:
```bash
npm run seed
```
or manually:
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d @examples/sample-lead.json
```
**Use a real phone number you can answer** — it will actually call it.

**Optional — webhooks during local dev:**
```bash
ngrok http 3000
```
Copy the `https://...ngrok...` URL into `PUBLIC_BASE_URL` in `.env` and restart. When
deployed, set `PUBLIC_BASE_URL` to your real deployed backend URL instead.

**Optional — Docker:**
```bash
docker compose up --build
```
Reads the same `.env` file. The frontend isn't containerized — run it with `npm run dev`
in `web/` alongside the container.

---

## Do you need an API key?

**Yes — for CALL-E.** Without `CALLE_API_KEY` and `CALLE_BASE_URL` set, the server
throws a clear error on startup rather than failing silently. Nothing else in this repo
requires a key — no database, no third-party auth, no paid frontend services.

---

## 🏆 Hackathon Project

GhostLead was built for CALL-E's **"Your Code Is Calling"** hackathon, exploring what
happens when an AI agent doesn't just *analyze* a lead, but actually calls them —
in real time, with a real outcome, before a human ever has to.

---

## ❤️ Thanks

Thanks to the CALL-E team for building an API that makes a genuinely useful phone call
possible with a few lines of code, instead of a wall of telephony infrastructure.

---

## ⭐ If you find GhostLead interesting, consider starring this repository!

## License

MIT — see [`LICENSE`](LICENSE).
