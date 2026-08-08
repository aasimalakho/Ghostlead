# GhostLead

Most inbound leads (real estate, auto, insurance) go cold because no human calls back fast enough. GhostLead calls a new lead **within seconds** of them submitting a form, has a real phone conversation with them using [CALL-E](https://www.heycall-e.com/), and only hands the lead to a human rep once it's confirmed they're actually interested.

Built for the **CALL-E: Your Code Is Calling** hackathon.

## How it works

1. A lead comes in (`POST /api/leads`) — from a website form, Zillow/Autotrader export, or a CRM automation.
2. GhostLead immediately asks **CALL-E** to place a real outbound call and hold a short qualifying conversation (`src/calle/qualifyLead.ts`, using the `@call-e/calle` SDK's `calls.createAndWait`).
3. CALL-E dials, talks, adapts to the conversation in real time, and returns a structured result (wants to proceed? timeline? financing in place?) — validated against the JSON schema in `src/types.ts`.
4. CALL-E also POSTs the terminal result to our webhook (`POST /calle/webhook`) for async delivery.
5. The lead is marked `qualified` or `cold` and the live dashboard (`web/`) updates instantly over Server-Sent Events.

This is a real integration, not a mock: `qualifyLeadByCall` genuinely imports and calls the CALL-E SDK at runtime.

## Repo layout

```
ghostlead/
├── src/                  Backend (Express + TypeScript)
│   ├── calle/             CALL-E SDK client + call-building logic
│   ├── routes/            /api/leads intake + /calle/webhook receiver
│   ├── store/              in-memory lead store + live SSE broadcast
│   └── server.ts
├── web/                   Frontend dashboard (Vite + React + Tailwind)
├── examples/              Sample lead payload for testing
├── scripts/                Convenience seed script
├── docs/SUBMISSION.md      Hackathon submission checklist
├── Dockerfile / docker-compose.yml
└── .env.example
```

## Requirements

- Node.js 20+
- A CALL-E account and API key (see below — **yes, you need one**)
- (Optional) Docker, if you'd rather run the API in a container
- (Optional) `ngrok` or similar, if you want CALL-E's webhook to reach your laptop during local dev

## 1. Get a CALL-E API key

CALL-E is the whole point of this project, so you do need real credentials:

1. Follow the install guide: <https://github.com/CALLE-AI/call-e-integrations>
2. Sign up — new accounts get **20 free calls** automatically.
3. Grab your `CALLE_API_KEY` and `CALLE_BASE_URL` from your CALL-E account/onboarding (the SDK is in beta, so the exact dashboard location may shift — check the docs above if unsure).

## 2. Configure

```bash
cp .env.example .env
```

Fill in:

```
CALLE_API_KEY=your_key_here
CALLE_BASE_URL=your_base_url_here
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
```

`PUBLIC_BASE_URL` is only load-bearing if you want CALL-E's webhook to reach your machine — see step 5.

## 3. Run the backend

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:3000`.

## 4. Run the dashboard

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. Note: the dashboard ships in **demo/simulation mode** (it animates mock leads on its own) so it's watchable and recordable without needing a live phone call. Wiring it to the live `/api/leads/stream` endpoint instead of the built-in simulator is a one-line swap in `web/src/App.jsx` — see the comment at the top of that file.

## 5. Send a real lead through CALL-E

```bash
npm run seed
```

or manually:

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d @examples/sample-lead.json
```

**Use your own phone number in `examples/sample-lead.json` before running this** — it will really call it.

### Webhooks (optional, for async result delivery)

If you want CALL-E to be able to POST results back to your machine while developing locally:

```bash
ngrok http 3000
```

Copy the `https://...ngrok...` URL into `PUBLIC_BASE_URL` in `.env`, restart `npm run dev`. When deployed for real, set `PUBLIC_BASE_URL` to your deployed URL instead.

## 6. Run with Docker (optional)

```bash
docker compose up --build
```

Reads the same `.env` file. The frontend isn't containerized yet (see the note in `docker-compose.yml`) — run it with `npm run dev` in `web/` alongside the container.

## Do you need an API key?

**Yes — for CALL-E.** Without `CALLE_API_KEY` and `CALLE_BASE_URL` set, the server throws a clear error on startup rather than failing silently (`src/calle/client.ts`). Nothing else in this repo requires a key: no database, no third-party auth, no paid frontend services.

## Hackathon submission

See [`docs/SUBMISSION.md`](docs/SUBMISSION.md) for the exact steps (PR to CALL-E's public repo, Devpost form, demo video).

## License

MIT — see [`LICENSE`](LICENSE).
