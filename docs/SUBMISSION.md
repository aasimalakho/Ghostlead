# Submission checklist — CALL-E: Your Code Is Calling

Based on the official rules at https://call-e.devpost.com/

- [ ] **Install CALL-E and get an API key** (20 free calls on signup) — see root README.
- [ ] **Build & deploy** a functional application that uses CALL-E's SDK, API, MCP, CLI, or SKILL to solve a real problem. GhostLead uses the **SDK** (`@call-e/calle`) directly against `POST /v1/calls`.
- [ ] **Open a pull request** to CALL-E's public contribution repo:
      https://github.com/CALLE-AI/awesome-phone-call-agents
      Follow that repo's README to submit into the correct **Contribution Area**. GhostLead is a full application (backend + dashboard), so it belongs under the **apps/** area, not `skills/` or `plugins/`. Confirm the exact folder name in that repo's README before opening the PR, since these can change.
- [ ] Your PR should include: short description, compatibility notes, safety notes for the real-world side effect (this app places real outbound phone calls), setup/install instructions, and no secrets or real phone numbers/API keys committed — use `+141xxxxxxxx`-style masked numbers in any public docs or screenshots.
- [ ] **Record a ~3 minute demo video**, upload to YouTube or Vimeo, set to public.
      Good beats to hit: (1) a lead submits a form, (2) the dashboard's 60-second ring starts counting down, (3) CALL-E actually rings the phone, (4) the live transcript panel updates, (5) the lead flips to "Qualified" and hands off.
- [ ] **Submit on Devpost**: provide the PR URL and the video link on the submission form.
- [ ] Double check: does the submission clearly show CALL-E being called at runtime (not just referenced in text)? Judges specifically look for this — `src/calle/qualifyLead.ts` is the file to point to.

## Safety note for the PR

CALL-E places real outbound phone calls. GhostLead:
- Only calls numbers explicitly submitted through `/api/leads` (no scraping, no bulk dialing).
- Keeps each call task short and instructs CALL-E to end politely if the person isn't interested.
- Does not store call recordings — only the structured qualification result and a transcript summary.
