// LIVE MODE — this component connects to the real GhostLead backend via
// Server-Sent Events (src/routes/leads.ts -> GET /api/leads/stream) and
// renders whatever leads actually exist, in their real CALL-E-reported
// state. No mock data generator here anymore.
import { useState, useEffect, useMemo } from "react";
import { ArrowUpRight, Flame, Radio } from "lucide-react";

// Vite bakes VITE_* vars in at build time — set VITE_API_URL in your host's
// env vars (Render: Static Site -> Environment) and rebuild for it to apply.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* GhostMark — the mascot. A lead that doesn't get called back fast   */
/* enough "ghosts" you — so the mascot's own solidity tells the story:*/
/* wide-eyed and opaque when things are moving, fading to a translu-  */
/* cent outline the moment a lead goes cold or a call fails.          */
/* ------------------------------------------------------------------ */
function GhostMark({ mood = "awake", size = 28, className = "", style = {} }) {
  const moods = {
    awake: { opacity: 1, eye: "M 22 27 a 3 3 0 1 1 0.1 0 M 42 27 a 3 3 0 1 1 0.1 0", blush: true },
    sleepy: { opacity: 0.72, eye: "M 18 27 h 8 M 38 27 h 8", blush: false },
    oncall: { opacity: 1, eye: "M 22 27 a 3 3 0 1 1 0.1 0 M 42 27 a 3 3 0 1 1 0.1 0", blush: true },
    happy: { opacity: 1, eye: "M 18 26 q 4 6 8 0 M 38 26 q 4 6 8 0", blush: true },
    faint: { opacity: 0.32, eye: "M 18 27 h 8 M 38 27 h 8", blush: false },
  };
  const m = moods[mood] || moods.awake;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ opacity: m.opacity, transition: "opacity .4s ease", ...style }}
      fill="none"
    >
      <path
        d="M32 6c12.15 0 22 9.85 22 22v24.5c0 1.9-2.1 3-3.66 1.9l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2a2.3 2.3 0 0 1-2.66 0l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2a2.3 2.3 0 0 1-2.66 0l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2C12.6 56.5 10 55.4 10 53.5V28C10 15.85 19.85 6 32 6Z"
        fill="currentColor"
      />
      <path d={m.eye} stroke="#241F3D" strokeWidth="3" strokeLinecap="round" />
      {m.blush && (
        <>
          <ellipse cx="15" cy="32" rx="3.2" ry="2.2" fill="#241F3D" opacity="0.12" />
          <ellipse cx="49" cy="32" rx="3.2" ry="2.2" fill="#241F3D" opacity="0.12" />
        </>
      )}
    </svg>
  );
}

function ResponseRing({ pct, size = 52, urgent }) {
  const deg = Math.max(0, Math.min(360, pct * 3.6));
  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${urgent ? "#FF7A93" : "#9B8AFB"} ${deg}deg, #ECE7FC ${deg}deg)`,
      }}
    >
      <div
        className="absolute rounded-full bg-white flex items-center justify-center"
        style={{ width: size - 8, height: size - 8 }}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new: { label: "Ringing in", cls: "text-[#B5540E] bg-[#FFEEDD]" },
    connecting: { label: "On call", cls: "text-[#6D5AE6] bg-[#EFEBFF]" },
    qualified: { label: "Qualified", cls: "text-[#0E9A7C] bg-[#DFFAF2]" },
    cold: { label: "Ghosted", cls: "text-[#8D86AC] bg-[#F1EDFF]" },
    error: { label: "Call failed", cls: "text-[#C43E5C] bg-[#FFE6EC]" },
  };
  const m = map[status] || map.new;
  return (
    <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

/** Seconds since a lead was created — recomputed every tick so the ring animates. */
function useElapsedSeconds(createdAt, tick) {
  return useMemo(() => {
    if (!createdAt) return 0;
    return Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 1000));
  }, [createdAt, tick]);
}

function LeadRow({ lead, tick }) {
  const elapsed = useElapsedSeconds(lead.createdAt, tick);
  const countdown = Math.max(0, 60 - elapsed);
  const urgent = lead.status === "new" && countdown <= 20;

  return (
    <div className="rise flex items-center gap-3 p-3 rounded-2xl border border-[#ECE7FC] bg-white shadow-[0_1px_2px_rgba(36,31,61,0.04)]">
      {lead.status === "new" ? (
        <div className="relative">
          <ResponseRing pct={(countdown / 60) * 100} urgent={urgent} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-[#241F3D]">
            {countdown}
          </span>
        </div>
      ) : (
        <div className="w-13 h-13 w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[#F7F5FF] shrink-0">
          {lead.status === "qualified" && <GhostMark mood="happy" size={30} className="text-[#4FD9B8]" />}
          {(lead.status === "cold" || lead.status === "error") && (
            <GhostMark mood="faint" size={30} className="text-[#B7AEE0]" />
          )}
          {lead.status === "connecting" && <GhostMark mood="oncall" size={30} className="text-[#9B8AFB] pulse-dot" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] text-[#241F3D] truncate">{lead.name}</span>
          <span className="text-[11px] text-[#8D86AC] font-mono">· {lead.source}</span>
        </div>
        <div className="mt-1">
          <StatusPill status={lead.status} />
          {lead.responseTimeSeconds != null && (
            <span className="text-[11px] font-mono text-[#8D86AC] ml-2">
              connected in {lead.responseTimeSeconds}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GhostLeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  // Live connection to the backend
  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/leads/stream`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      try {
        setLeads(JSON.parse(event.data));
      } catch {
        // ignore malformed/keep-alive frames
      }
    };
    return () => source.close();
  }, []);

  // Local clock, just to animate the countdown ring every second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const activeLead = leads.find((l) => l.status === "connecting");
  const lastResolved = leads.find((l) => l.status === "qualified" || l.status === "cold");
  const qualifiedCount = leads.filter((l) => l.status === "qualified").length;
  const resolved = leads.filter((l) => l.responseTimeSeconds != null);
  const avgResponse = resolved.length
    ? Math.round(resolved.reduce((a, l) => a + l.responseTimeSeconds, 0) / resolved.length)
    : 0;

  return (
    <div className="min-h-screen w-full text-[#241F3D] relative overflow-hidden" style={{ background: "#FBFAFF", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .rise { animation: rise .35s ease-out; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .float { animation: float 3.2s ease-in-out infinite; }
        ::selection { background: #9B8AFB; color: #FFFFFF; }
      `}</style>

      {/* ambient mist — the signature touch: two soft, blurred blobs drifting behind the UI */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #E3DBFF 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute top-40 -right-32 w-[480px] h-[480px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #D2F7EC 0%, transparent 70%)" }} />

      <div className="relative">
        <header className="border-b border-[#ECE7FC] px-6 py-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B8ACFF] to-[#9B8AFB] flex items-center justify-center shadow-[0_2px_8px_rgba(155,138,251,0.35)]">
              <GhostMark mood={connected ? "awake" : "sleepy"} size={22} className="text-white float" />
            </div>
            <span className="font-display font-semibold text-[19px] tracking-tight">GhostLead</span>
            <span className="text-[#8D86AC] text-[13px] ml-1 hidden sm:inline">Response Console</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1 rounded-full ${connected ? "text-[#0E9A7C] bg-[#DFFAF2]" : "text-[#8D86AC] bg-[#F1EDFF]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#0E9A7C] pulse-dot" : "bg-[#8D86AC]"}`} />
            {connected ? "LIVE" : "CONNECTING…"}
          </div>
        </header>

        <div className="grid grid-cols-3 border-b border-[#ECE7FC]">
          {[
            { label: "Leads received", value: leads.length, tint: "#EFEBFF", accent: "#6D5AE6", icon: "phone" },
            { label: "Avg. response time", value: resolved.length ? `${avgResponse}s` : "—", tint: "#E6F3FF", accent: "#2B8FE6", icon: "arrow" },
            { label: "Qualified", value: qualifiedCount, tint: "#DFFAF2", accent: "#0E9A7C", icon: "flame" },
          ].map((s, i) => (
            <div key={i} className={`px-6 py-5 ${i < 2 ? "border-r border-[#ECE7FC]" : ""}`}>
              <div className="flex items-center gap-1.5 text-[#8D86AC] text-[11px] font-mono uppercase tracking-wider mb-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: s.tint, color: s.accent }}>
                  {s.icon === "phone" && <GhostMark mood="awake" size={12} />}
                  {s.icon === "arrow" && <ArrowUpRight size={11} />}
                  {s.icon === "flame" && <Flame size={11} />}
                </span>
                {s.label}
              </div>
              <div className="font-display font-semibold text-[26px]" style={{ color: s.accent }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <section className="p-6 border-r border-[#ECE7FC]">
            <h2 className="font-display text-[13px] uppercase tracking-wider text-[#8D86AC] mb-4">
              Leads {leads.length === 0 && "— waiting for the first one"}
            </h2>
            <div className="space-y-2">
              {leads.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#DED6FF] bg-[#F7F5FF] p-10 text-center text-[#8D86AC] text-[13px]">
                  <GhostMark mood="sleepy" size={36} className="text-[#C6BAFA] float" />
                  Nothing to see here yet. POST a lead to {API_URL}/api/leads before it slips away.
                </div>
              )}
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} tick={tick} />
              ))}
            </div>
          </section>

          <section className="p-6">
            <h2 className="font-display text-[13px] uppercase tracking-wider text-[#8D86AC] mb-4">
              Active call
            </h2>
            {activeLead ? (
              <div className="rounded-2xl border border-[#ECE7FC] bg-white p-4 shadow-[0_1px_2px_rgba(36,31,61,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-display font-semibold text-[16px]">{activeLead.name}</div>
                    <div className="text-[12px] text-[#8D86AC] font-mono">{activeLead.source} lead</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6D5AE6] bg-[#EFEBFF] px-2 py-1 rounded-full">
                    <Radio size={12} className="pulse-dot" /> on call
                  </div>
                </div>
                <p className="text-[13px] text-[#8D86AC] leading-snug">
                  CALL-E is on the phone with this lead now — gathering intent, timeline,
                  and financing status. Results post here the moment the call ends.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#DED6FF] bg-[#F7F5FF] p-10 text-center text-[#8D86AC] text-[13px]">
                <GhostMark mood="sleepy" size={32} className="text-[#C6BAFA]" />
                No call in progress right now.
              </div>
            )}

            {lastResolved && (
              <div className="mt-4 rounded-2xl border border-[#ECE7FC] bg-white p-4 shadow-[0_1px_2px_rgba(36,31,61,0.04)]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8D86AC] mb-2">
                  Last result — {lastResolved.name}
                </div>
                {lastResolved.qualification ? (
                  <div className="space-y-1.5 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${lastResolved.qualification.wants_to_proceed === "yes" ? "bg-[#4FD9B8]" : "bg-[#D8D2F0]"}`} />
                      Wants to proceed: {lastResolved.qualification.wants_to_proceed}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D8D2F0]" />
                      Timeline: {lastResolved.qualification.timeline}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D8D2F0]" />
                      Financing in place: {lastResolved.qualification.financing_in_place}
                    </div>
                    {lastResolved.qualification.notes && (
                      <p className="text-[#8D86AC] mt-2 text-[12px] leading-snug">
                        {lastResolved.qualification.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#8D86AC]">
                    {lastResolved.transcriptSummary || "No structured result returned for this call."}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
