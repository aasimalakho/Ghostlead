// NOTE: this component runs in self-contained DEMO/SIMULATION mode — it
// generates its own mock leads so it's watchable without a live CALL-E call.
// To wire it to the real backend instead: replace the `useEffect` simulation
// clock below with an EventSource subscription to `${API_URL}/api/leads/stream`
// (see src/routes/leads.ts in the backend) and set the `leads` state from
// each SSE message instead of the local reducer.
import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  Circle,
  Radio,
  ArrowUpRight,
  Flame,
} from "lucide-react";

// ---------------------------------------------------------------------------
// GhostLead — live lead-response console
// Signature element: the 60s ring. Every incoming lead gets a radial
// countdown that races down from 60 seconds — the entire pitch of the
// product ("we call before the human competitor even opens the CRM tab")
// made visible as the one thing you can't look away from.
// ---------------------------------------------------------------------------

const SOURCES = ["Zillow", "Website Form", "Facebook Ad", "Autotrader", "Referral"];
const NAMES = [
  "Priya Nandan", "Marcus Webb", "Elena Ford", "Tomas Reyes", "Grace Lin",
  "Devon Okafor", "Sara Al-Amin", "Jake Muller", "Aiko Tanaka", "Ben Ortiz",
];
const TRANSCRIPT = [
  { who: "agent", text: "Hi, this is Ava calling about the property you just inquired on — got 60 seconds?" },
  { who: "lead", text: "Oh — wow, that was fast. Yeah, sure." },
  { who: "agent", text: "Great. Are you still looking to move in the next 3 months?" },
  { who: "lead", text: "Yeah, pretty actively actually." },
  { who: "agent", text: "Got it. And is financing already in place, or should I flag pre-approval help?" },
  { who: "lead", text: "Not yet, that'd be useful." },
  { who: "agent", text: "Perfect — I'm connecting you to Marcus on our team now." },
];

function randomLead(id) {
  return {
    id,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    status: "new",
    countdown: 45 + Math.floor(Math.random() * 15),
    connectAt: 6 + Math.floor(Math.random() * 14),
    outcome: null,
    responseTime: null,
    transcriptIdx: 0,
  };
}

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
    connecting: { label: "Dialing", cls: "text-[#4FB0FF] bg-[#122333]" },
    live: { label: "On call", cls: "text-[#4FB0FF] bg-[#122333]" },
    qualified: { label: "Qualified", cls: "text-[#3DDC84] bg-[#0F2A1C]" },
    cold: { label: "No answer", cls: "text-[#6B7680] bg-[#1B222B]" },
  };
  const m = map[status] || map.new;
  return (
    <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded ${m.cls}`}>
      {m.label}
    </span>
  );
}

export default function GhostLeadDashboard() {
  const [leads, setLeads] = useState(() => [randomLead(1), randomLead(2)]);
  const nextId = useRef(3);
  const [tick, setTick] = useState(0);
  const [typedLines, setTypedLines] = useState([]);

  // main simulation clock
  useEffect(() => {
    const t = setInterval(() => {
      setTick((n) => n + 1);
      setLeads((prev) => {
        let next = prev.map((l) => {
          if (l.status === "new") {
            const cd = l.countdown - 1;
            if (l.countdown - l.connectAt <= 1 || cd <= 0) {
              return { ...l, status: "connecting", countdown: Math.max(cd, 0) };
            }
            return { ...l, countdown: cd };
          }
          if (l.status === "connecting") {
            return { ...l, status: "live", responseTime: 60 - l.countdown };
          }
          if (l.status === "live") {
            const idx = l.transcriptIdx + 1;
            if (idx >= TRANSCRIPT.length) {
              return {
                ...l,
                status: Math.random() > 0.28 ? "qualified" : "cold",
              };
            }
            return { ...l, transcriptIdx: idx };
          }
          return l;
        });

        // spawn a new lead occasionally
        if (Math.random() < 0.16 && next.length < 6) {
          next = [randomLead(nextId.current++), ...next];
        }
        return next.slice(0, 6);
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const liveLead = leads.find((l) => l.status === "live");
  const qualifiedToday = leads.filter((l) => l.status === "qualified").length + 14;
  const resolved = leads.filter((l) => l.responseTime != null);
  const avgResponse = resolved.length
    ? Math.round(resolved.reduce((a, l) => a + l.responseTime, 0) / resolved.length)
    : 34;

  useEffect(() => {
    if (liveLead) {
      setTypedLines(TRANSCRIPT.slice(0, liveLead.transcriptIdx + 1));
    }
  }, [liveLead?.transcriptIdx, liveLead?.id]);

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

      {/* top bar */}
      <header className="border-b border-[#1B222B] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#FF6B35] flex items-center justify-center">
            <Phone size={15} className="text-[#0B0F14]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight">GhostLead</span>
          <span className="text-[#6B7680] text-[13px] ml-1 hidden sm:inline">Response Console</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#3DDC84]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84] pulse-dot" />
          LIVE
        </div>
      </header>

      {/* stat strip */}
      <div className="grid grid-cols-3 border-b border-[#1B222B]">
        {[
          { label: "Leads called today", value: qualifiedToday + 9, icon: PhoneCall },
          { label: "Avg. response time", value: `${avgResponse}s`, icon: ArrowUpRight, accent: "#4FB0FF" },
          { label: "Qualified → handed off", value: qualifiedToday, icon: Flame, accent: "#3DDC84" },
        ].map((s, i) => (
          <div key={i} className={`px-6 py-4 ${i < 2 ? "border-r border-[#1B222B]" : ""}`}>
            <div className="flex items-center gap-1.5 text-[#6B7680] text-[11px] font-mono uppercase tracking-wider mb-1.5">
              <s.icon size={12} />
              {s.label}
            </div>
            <div
              className="font-display font-semibold text-2xl"
              style={{ color: s.accent || "#E8ECEF" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        {/* lead feed */}
        <section className="p-6 border-r border-[#1B222B]">
          <h2 className="font-display text-[13px] uppercase tracking-wider text-[#6B7680] mb-4">
            Incoming leads
          </h2>
          <div className="space-y-2">
            {leads.map((l) => {
              const urgent = l.status === "new" && l.countdown <= 20;
              return (
                <div
                  key={l.id}
                  className="rise flex items-center gap-3 p-3 rounded-lg border border-[#1B222B] bg-[#0E1319]"
                >
                  {l.status === "new" ? (
                    <div className="relative">
                      <ResponseRing pct={(l.countdown / 60) * 100} urgent={urgent} />
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px]">
                        {l.countdown}
                      </span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#131920] shrink-0">
                      {l.status === "qualified" && <CheckCircle2 size={22} className="text-[#3DDC84]" />}
                      {l.status === "cold" && <PhoneOff size={20} className="text-[#6B7680]" />}
                      {(l.status === "connecting" || l.status === "live") && (
                        <Radio size={20} className="text-[#4FB0FF] pulse-dot" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[14px] truncate">{l.name}</span>
                      <span className="text-[11px] text-[#6B7680] font-mono">· {l.source}</span>
                    </div>
                    <div className="mt-1">
                      <StatusPill status={l.status} />
                      {l.responseTime != null && (
                        <span className="text-[11px] font-mono text-[#6B7680] ml-2">
                          connected in {l.responseTime}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* active call panel */}
        <section className="p-6">
          <h2 className="font-display text-[13px] uppercase tracking-wider text-[#6B7680] mb-4">
            Active call
          </h2>
          {liveLead ? (
            <div className="rounded-lg border border-[#1B222B] bg-[#0E1319] p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display font-semibold text-[16px]">{liveLead.name}</div>
                  <div className="text-[12px] text-[#6B7680] font-mono">{liveLead.source} lead</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4FB0FF]">
                  <Radio size={13} className="pulse-dot" /> connected
                </div>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {typedLines.map((t, i) => (
                  <div
                    key={i}
                    className={`rise text-[13px] leading-snug px-3 py-2 rounded-lg max-w-[85%] ${
                      t.who === "agent"
                        ? "bg-[#12212F] text-[#BFE0FF] ml-0"
                        : "bg-[#171D24] text-[#D6DADE] ml-auto"
                    }`}
                  >
                    <div className="text-[9px] font-mono uppercase tracking-wider opacity-50 mb-0.5">
                      {t.who === "agent" ? "GhostLead AI" : liveLead.name.split(" ")[0]}
                    </div>
                    {t.text}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#1B222B] flex items-center gap-4 text-[11px] font-mono text-[#6B7680]">
                <span className="flex items-center gap-1"><Circle size={7} className="fill-[#3DDC84] text-[#3DDC84]" /> Intent</span>
                <span className="flex items-center gap-1"><Circle size={7} className="fill-[#3DDC84] text-[#3DDC84]" /> Timeline</span>
                <span className="flex items-center gap-1"><Circle size={7} className="fill-[#6B7680] text-[#6B7680]" /> Financing</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#1B222B] p-10 text-center text-[#6B7680] text-[13px]">
              No call in progress — the next lead to hit the ring gets called first.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
