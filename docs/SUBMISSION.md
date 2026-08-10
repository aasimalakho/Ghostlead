# Submission Checklist — CALL-E: Your Code Is Calling

Reference: official rules at https://call-e.devpost.com/

## Positioning

GhostLead is scoped for a specific vertical rather than framed as a general-purpose
calling tool: real estate agents and auto dealerships, whose deals are frequently lost
because leads are not called back quickly enough. GhostLead calls a new lead within
seconds of submission, conducts a qualifying conversation via CALL-E, and escalates to
a human representative only once intent, timeline, and financing status are confirmed.

This framing is used consistently across the PR description, the Devpost submission,
and the demo video narration.

## Checklist

- [x] CALL-E API key obtained (20 free calls on signup); see root README for setup.
- [x] Application built and deployed, using CALL-E's SDK (`@call-e/calle`) directly against `POST /v1/calls`.
- [ ] Pull request opened against CALL-E's public contribution repository: https://github.com/CALLE-AI/awesome-phone-call-agents
      GhostLead is a full application (backend + dashboard) and belongs under the **apps/** contribution area rather than `skills/` or `plugins/`. The exact folder name should be confirmed against that repository's README before opening the PR, as naming may change.
- [ ] PR description includes: a short summary using the positioning above, compatibility notes, a safety note covering the real-world side effect of placing outbound phone calls, and setup/install instructions. No secrets, API keys, or real phone numbers are committed — masked numbers (`+141xxxxxxxx` format) are used in any public docs or screenshots.
- [ ] Demo video recorded (~3 minutes), uploaded to YouTube or Vimeo, set to public.
      Recommended structure: state the problem in one sentence (real estate/auto leads go cold without a fast callback), then demonstrate the flow live:
      1. Submit a lead using the "Send test lead" form in the dashboard's Incoming Leads panel.
      2. Lead appears with the 60-second response countdown.
      3. CALL-E places the outbound call, audible in the recording.
      4. Qualifying conversation proceeds (intent, timeline, financing).
      5. Call concludes; dashboard updates the lead to "Qualified" live via the SSE stream.
- [ ] Devpost submission completed with: PR URL, video URL, CALL-E account email, and optionally the live demo URL (https://ghostlead-xujm.onrender.com).
- [ ] Submission demonstrates CALL-E being called at runtime, not merely referenced in text — `src/calle/qualifyLead.ts` is the relevant file for judges to review.
- [ ] PR description and Devpost text explicitly name the real estate/auto dealership niche rather than describing the tool in generic terms. This maps directly to the "Real World Impact" judging criterion.

## Safety Note (for PR description)

CALL-E places real outbound phone calls. GhostLead constrains this as follows:
- Calls are placed only to numbers explicitly submitted through `/api/leads` — no scraping, no bulk dialing.
- Each call task is kept short, with instructions for CALL-E to end the call politely if the recipient is not interested.
- Call recordings are not stored; only the structured qualification result and a transcript summary are retained.

## Reference Links

- Live dashboard: https://ghostlead-xujm.onrender.com
- Backend API: https://ghostlead-api.onrender.com
- Repository: https://github.com/aasimalakho/Ghostlead
