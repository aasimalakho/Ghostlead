// LIVE MODE — this component connects to the real GhostLead backend via
// Server-Sent Events (src/routes/leads.ts -> GET /api/leads/stream) and
// renders whatever leads actually exist, in their real CALL-E-reported
// state. No mock data generator here anymore.
import { useState, useEffect, useMemo } from "react";
import {
  Phone,
  PhoneOff,
  CheckCircle2,
  Circle,
  Radio,
  ArrowUpRight,
  Flame,
} from "lucide-react";

// Vite bakes VITE_* vars in at build time — set VITE_API_URL in your host's
// env vars (Render: Static Site -> Environment) and rebuild for it to apply.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ResponseRing({ pct, size = 56, urgent }) {
  const deg = Math.max(0, Math.min(360, pct * 3.6));
  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${urgent ? "#FF6B35" : "#4FB0FF"} ${deg}deg, #1B222B ${deg}deg)`,
      }}
    >
      <div
        className="absolute rounded-full bg-[#0B0F14] flex items-center justify-center"
        style={{ width: size - 8, height: size - 8 }}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new: { label: "Ringing in", cls: "text-[#FF6B35] bg-[#2A1A12]" },
    connecting: { label: "On call", cls: "text-[#4FB0FF] bg-[#122333]" },
    qualified: { label: "Qualified", cls: "text-[#3DDC84] bg-[#0F2A1C]" },
    cold: { label: "Not interested", cls: "text-[#6B7680] bg-[#1B222B]" },
    error: { label: "Call failed", cls: "text-[#FF6B35] bg-[#2A1A12]" },
  };
  const m = map[status] || map.new;
  return (
    <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded ${m.cls}`}>
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
    <div className="rise flex items-center gap-3 p-3 rounded-lg border border-[#1B222B] bg-[#0E1319]">
      {lead.status === "new" ? (
        <div className="relative">
          <ResponseRing pct={(countdown / 60) * 100} urgent={urgent} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px]">
            {countdown}
          </span>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#131920] shrink-0">
          {lead.status === "qualified" && <CheckCircle2 size={22} className="text-[#3DDC84]" />}
          {(lead.status === "cold" || lead.status === "error") && (
            <PhoneOff size={20} className="text-[#6B7680]" />
          )}
          {lead.status === "connecting" && <Radio size={20} className="text-[#4FB0FF] pulse-dot" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] truncate">{lead.name}</span>
          <span className="text-[11px] text-[#6B7680] font-mono">· {lead.source}</span>
        </div>
        <div className="mt-1">
          <StatusPill status={lead.status} />
          {lead.responseTimeSeconds != null && (
            <span className="text-[11px] font-mono text-[#6B7680] ml-2">
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
    <div
      className="min-h-screen w-full text-[#E8ECEF]"
      style={{ background: "#0B0F14", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .rise { animation: rise .35s ease-out; }
        ::selection { background: #FF6B35; color: #0B0F14; }
      `}</style>

      <header className="border-b border-[#1B222B] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#FF6B35] flex items-center justify-center">
            <Phone size={15} className="text-[#0B0F14]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight">GhostLead</span>
          <span className="text-[#6B7680] text-[13px] ml-1 hidden sm:inline">Response Console</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[12px] font-mono ${connected ? "text-[#3DDC84]" : "text-[#6B7680]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#3DDC84] pulse-dot" : "bg-[#6B7680]"}`} />
          {connected ? "LIVE" : "CONNECTING…"}
        </div>
      </header>

      <div className="grid grid-cols-3 border-b border-[#1B222B]">
        {[
          { label: "Leads received", value: leads.length, icon: Phone },
          { label: "Avg. response time", value: resolved.length ? `${avgResponse}s` : "—", icon: ArrowUpRight, accent: "#4FB0FF" },
          { label: "Qualified", value: qualifiedCount, icon: Flame, accent: "#3DDC84" },
        ].map((s, i) => (
          <div key={i} className={`px-6 py-4 ${i < 2 ? "border-r border-[#1B222B]" : ""}`}>
            <div className="flex items-center gap-1.5 text-[#6B7680] text-[11px] font-mono uppercase tracking-wider mb-1.5">
              <s.icon size={12} />
              {s.label}
            </div>
            <div className="font-display font-semibold text-2xl" style={{ color: s.accent || "#E8ECEF" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <section className="p-6 border-r border-[#1B222B]">
          <h2 className="font-display text-[13px] uppercase tracking-wider text-[#6B7680] mb-4">
            Leads {leads.length === 0 && "— waiting for the first one"}
          </h2>
          <div className="space-y-2">
            {leads.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#1B222B] p-8 text-center text-[#6B7680] text-[13px]">
                No leads yet. POST one to {API_URL}/api/leads to see it appear here.
              </div>
            )}
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} tick={tick} />
            ))}
          </div>
        </section>

        <section className="p-6">
          <h2 className="font-display text-[13px] uppercase tracking-wider text-[#6B7680] mb-4">
            Active call
          </h2>
          {activeLead ? (
            <div className="rounded-lg border border-[#1B222B] bg-[#0E1319] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-display font-semibold text-[16px]">{activeLead.name}</div>
                  <div className="text-[12px] text-[#6B7680] font-mono">{activeLead.source} lead</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4FB0FF]">
                  <Radio size={13} className="pulse-dot" /> on call
                </div>
              </div>
              <p className="text-[13px] text-[#6B7680] leading-snug">
                CALL-E is on the phone with this lead now — gathering intent, timeline,
                and financing status. Results post here the moment the call ends.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#1B222B] p-10 text-center text-[#6B7680] text-[13px]">
              No call in progress right now.
            </div>
          )}

          {lastResolved && (
            <div className="mt-4 rounded-lg border border-[#1B222B] bg-[#0E1319] p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#6B7680] mb-2">
                Last result — {lastResolved.name}
              </div>
              {lastResolved.qualification ? (
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Circle size={7} className={lastResolved.qualification.wants_to_proceed === "yes" ? "fill-[#3DDC84] text-[#3DDC84]" : "fill-[#6B7680] text-[#6B7680]"} />
                    Wants to proceed: {lastResolved.qualification.wants_to_proceed}
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle size={7} className="fill-[#6B7680] text-[#6B7680]" />
                    Timeline: {lastResolved.qualification.timeline}
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle size={7} className="fill-[#6B7680] text-[#6B7680]" />
                    Financing in place: {lastResolved.qualification.financing_in_place}
                  </div>
                  {lastResolved.qualification.notes && (
                    <p className="text-[#6B7680] mt-2 text-[12px] leading-snug">
                      {lastResolved.qualification.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-[#6B7680]">
                  {lastResolved.transcriptSummary || "No structured result returned for this call."}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
