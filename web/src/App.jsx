// LIVE MODE — this component connects to the real GhostLead backend via
// Server-Sent Events (src/routes/leads.ts -> GET /api/leads/stream) and
// renders whatever leads actually exist, in their real CALL-E-reported
// state. No mock data generator here anymore.
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight, Flame, Radio, RefreshCw, Search, PhoneCall, Sparkles } from "lucide-react";

// Vite bakes VITE_* vars in at build time — set VITE_API_URL in your host's
// env vars (Render: Static Site -> Environment) and rebuild for it to apply.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ================================================================== */
/* Design tokens — dark / neon theme                                  */
/* ================================================================== */
function DesignTokens() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      .gl-root {
        --bg: #0A0B10;
        --surface: #14151D;
        --surface-tint: #191B24;
        --border: #262835;
        --border-strong: #383C4E;
        --ink: #F5F6FA;
        --muted: #9298AC;
        --muted-2: #5C6274;
        --neon: #C6FF4A;
        --neon-dim: rgba(198,255,74,0.14);
        --neon-dark: #0A0B10;
        --cyan: #4AF1E8;
        --cyan-bg: rgba(74,241,232,0.12);
        --amber: #FFD24A;
        --amber-bg: rgba(255,210,74,0.12);
        --pink: #FF5C8A;
        --pink-bg: rgba(255,92,138,0.14);
        --grad-primary: linear-gradient(135deg, #DFFF7A 0%, #C6FF4A 60%, #9BE62E 100%);
        --grad-blue: linear-gradient(135deg, #7DF7EF 0%, #4AF1E8 100%);
        --grad-emerald: linear-gradient(135deg, #DFFF7A 0%, #9BE62E 100%);
        --grad-dark: linear-gradient(155deg, #14151D 0%, #1B1E14 60%, #23280F 100%);
        --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
        --shadow-md: 0 8px 24px rgba(198,255,74,0.10);
        --shadow-lift: 0 20px 44px rgba(198,255,74,0.16);
        --shadow-glow: 0 0 0 1px rgba(198,255,74,0.15), 0 25px 60px rgba(198,255,74,0.20);
      }

      .font-display { font-family: 'Baloo 2', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }

      @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }

      @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .rise { animation: rise .35s ease-out; }

      @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      .float { animation: float 3.4s ease-in-out infinite; }
      @keyframes float-slow { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(1.5deg); } }
      .float-slow { animation: float-slow 7s ease-in-out infinite; }

      @keyframes glow-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(198,255,74,0.45); } 50% { box-shadow: 0 0 0 6px rgba(198,255,74,0); } }
      .glow-ring { animation: glow-ring 1.8s ease-out infinite; }

      @keyframes ripple { 0% { transform: scale(0.9); opacity: .6; } 100% { transform: scale(1.9); opacity: 0; } }
      .ripple { animation: ripple 2.6s cubic-bezier(.2,.6,.4,1) infinite; }

      @keyframes wave { 0%,100% { height: 25%; } 50% { height: 100%; } }
      .wave-bar { animation: wave 1s ease-in-out infinite; }

      @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
      .skeleton {
        background: linear-gradient(90deg, #191B24 25%, #22252F 37%, #191B24 63%);
        background-size: 400px 100%;
        animation: shimmer 1.4s ease-in-out infinite;
      }

      @keyframes dash-flow { to { stroke-dashoffset: -200; } }
      .dash-flow { animation: dash-flow 6s linear infinite; }

      .gl-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .gl-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); border-color: var(--neon); }

      .gl-btn { transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease; }
      .gl-btn:hover { transform: translateY(-1px); }
      .gl-btn:active { transform: translateY(0); }

      .dot-grid {
        background-image: radial-gradient(rgba(198,255,74,0.5) 1px, transparent 1px);
        background-size: 14px 14px;
      }
      .dot-grid-dark {
        background-image: radial-gradient(rgba(198,255,74,0.25) 1px, transparent 1px);
        background-size: 16px 16px;
      }
      .grid-lines {
        background-image:
          linear-gradient(rgba(198,255,74,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(198,255,74,0.06) 1px, transparent 1px);
        background-size: 44px 44px;
      }

      ::selection { background: #C6FF4A; color: #0A0B10; }
      input::placeholder { color: var(--muted-2); }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* GhostMark — brand mascot, now rendered in neon. Solidity still     */
/* communicates state: full neon glow while live, dimming to a faint  */
/* outline once a lead goes cold.                                     */
/* ------------------------------------------------------------------ */
function GhostMark({ mood = "awake", size = 28, className = "", style = {} }) {
  const moods = {
    awake: { opacity: 1, eye: "M 22 27 a 3 3 0 1 1 0.1 0 M 42 27 a 3 3 0 1 1 0.1 0", blush: true },
    sleepy: { opacity: 0.55, eye: "M 18 27 h 8 M 38 27 h 8", blush: false },
    oncall: { opacity: 1, eye: "M 22 27 a 3 3 0 1 1 0.1 0 M 42 27 a 3 3 0 1 1 0.1 0", blush: true },
    happy: { opacity: 1, eye: "M 18 26 q 4 6 8 0 M 38 26 q 4 6 8 0", blush: true },
    faint: { opacity: 0.28, eye: "M 18 27 h 8 M 38 27 h 8", blush: false },
  };
  const m = moods[mood] || moods.awake;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ opacity: m.opacity, transition: "opacity .4s ease", filter: m.opacity > 0.9 ? "drop-shadow(0 0 6px currentColor)" : "none", ...style }}
      fill="none"
    >
      <path
        d="M32 6c12.15 0 22 9.85 22 22v24.5c0 1.9-2.1 3-3.66 1.9l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2a2.3 2.3 0 0 1-2.66 0l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2a2.3 2.3 0 0 1-2.66 0l-4.5-3.2a2.3 2.3 0 0 0-2.68 0l-4.5 3.2C12.6 56.5 10 55.4 10 53.5V28C10 15.85 19.85 6 32 6Z"
        fill="currentColor"
      />
      <path d={m.eye} stroke="#0A0B10" strokeWidth="3" strokeLinecap="round" />
      {m.blush && (
        <>
          <ellipse cx="15" cy="32" rx="3.2" ry="2.2" fill="#0A0B10" opacity="0.18" />
          <ellipse cx="49" cy="32" rx="3.2" ry="2.2" fill="#0A0B10" opacity="0.18" />
        </>
      )}
    </svg>
  );
}

/** Concentric pulsing rings behind an icon — the "AI is listening" visual cue. */
function Ripples({ color = "var(--neon)" }) {
  return (
    <>
      <span className="absolute inset-0 rounded-full ripple" style={{ border: `1.5px solid ${color}`, animationDelay: "0s" }} />
      <span className="absolute inset-0 rounded-full ripple" style={{ border: `1.5px solid ${color}`, animationDelay: "0.9s" }} />
      <span className="absolute inset-0 rounded-full ripple" style={{ border: `1.5px solid ${color}`, animationDelay: "1.8s" }} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
function PrimaryButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`gl-btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[#0A0B10] text-[13px] font-bold shadow-[0_6px_18px_rgba(198,255,74,0.35)] hover:shadow-[0_10px_26px_rgba(198,255,74,0.5)] ${className}`}
      style={{ background: "var(--grad-primary)" }}
    >
      {children}
    </button>
  );
}

function IconButton({ icon: Icon, label, onClick, spinning = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`gl-btn w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-tint)] hover:text-[var(--neon)] hover:border-[var(--neon)] ${className}`}
    >
      <Icon size={15} className={spinning ? "animate-spin" : ""} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ConnectionBadge                                                     */
/* ------------------------------------------------------------------ */
function ConnectionBadge({ connected }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 text-[12px] font-mono font-medium px-3 py-1.5 rounded-full text-[var(--neon)] bg-[var(--neon-dim)] border border-[var(--neon)]/30">
        <span className="w-2 h-2 rounded-full bg-[var(--neon)] glow-ring" />
        Connected
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[12px] font-mono font-medium px-3 py-1.5 rounded-full text-[var(--amber)] bg-[var(--amber-bg)]">
      <span className="w-2 h-2 rounded-full bg-[var(--amber)] pulse-dot" />
      Connecting…
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MetricCard — dark surface + neon-glow icon chip. Numbers/captions  */
/* are always real, derived state — never invented.                   */
/* ------------------------------------------------------------------ */
function MetricCard({ icon, label, value, caption, grad, accent, loading }) {
  return (
    <div className="gl-card relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="dot-grid-dark pointer-events-none absolute -right-4 -bottom-4 w-24 h-24 opacity-70" style={{ maskImage: "radial-gradient(circle, black, transparent 70%)" }} />
      <div className="relative flex items-center gap-2.5 mb-4">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0A0B10] shadow-[0_0_14px_rgba(198,255,74,0.35)]"
          style={{ background: grad }}
        >
          {icon}
        </span>
        <span className="text-[12px] font-semibold text-[var(--ink)]">{label}</span>
      </div>
      {loading ? (
        <>
          <div className="skeleton h-9 w-20 rounded-lg mb-2" />
          <div className="skeleton h-3 w-32 rounded" />
        </>
      ) : (
        <div className="relative">
          <div className="font-display font-extrabold text-[34px] leading-none mb-1.5" style={{ color: accent }}>
            {value}
          </div>
          <div className="text-[13px] text-[var(--muted)]">{caption}</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState — glowing neon orb + ripples on a dark surface.         */
/* ------------------------------------------------------------------ */
function EmptyState({ mood = "sleepy", accent = "var(--neon)", accentBg = "var(--neon-dim)", title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-tint)] px-8 py-12 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <Ripples color={accent} />
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-[var(--shadow-md)]"
          style={{ background: accentBg }}
        >
          <GhostMark mood={mood} size={34} className="float" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <div className="font-display font-bold text-[16px] text-[var(--ink)] mb-1.5">{title}</div>
        <p className="text-[13px] text-[var(--muted)] max-w-[340px] leading-relaxed mx-auto">{description}</p>
      </div>
      {action}
    </div>
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
        background: `conic-gradient(${urgent ? "var(--pink)" : "var(--neon)"} ${deg}deg, var(--surface-tint) ${deg}deg)`,
      }}
    >
      <div className="absolute rounded-full bg-[var(--surface)] flex items-center justify-center" style={{ width: size - 8, height: size - 8 }} />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new: { label: "Ringing in", cls: "text-[var(--amber)] bg-[var(--amber-bg)]" },
    connecting: { label: "On call", cls: "text-[var(--cyan)] bg-[var(--cyan-bg)]" },
    qualified: { label: "Qualified", cls: "text-[var(--neon)] bg-[var(--neon-dim)]" },
    cold: { label: "Ghosted", cls: "text-[var(--muted)] bg-[var(--border)]" },
    error: { label: "Call failed", cls: "text-[var(--pink)] bg-[var(--pink-bg)]" },
  };
  const m = map[status] || map.new;
  return <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${m.cls}`}>{m.label}</span>;
}

const STATUS_BAR_COLOR = {
  new: "var(--amber)",
  connecting: "var(--cyan)",
  qualified: "var(--neon)",
  cold: "var(--muted-2)",
  error: "var(--pink)",
};

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
    <div className="rise gl-card flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: STATUS_BAR_COLOR[lead.status] || "var(--border-strong)" }} />
      {lead.status === "new" ? (
        <div className="relative ml-1">
          <ResponseRing pct={(countdown / 60) * 100} urgent={urgent} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-[var(--ink)]">{countdown}</span>
        </div>
      ) : (
        <div className="ml-1 w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[var(--surface-tint)] shrink-0">
          {lead.status === "qualified" && <GhostMark mood="happy" size={30} className="text-[var(--neon)]" />}
          {(lead.status === "cold" || lead.status === "error") && <GhostMark mood="faint" size={30} className="text-[var(--muted-2)]" />}
          {lead.status === "connecting" && <GhostMark mood="oncall" size={30} className="text-[var(--cyan)] pulse-dot" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] text-[var(--ink)] truncate">{lead.name}</span>
          <span className="text-[11px] text-[var(--muted)] font-mono">· {lead.source}</span>
        </div>
        <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
          <StatusPill status={lead.status} />
          {lead.responseTimeSeconds != null && (
            <span className="text-[11px] font-mono text-[var(--muted)]">connected in {lead.responseTimeSeconds}s</span>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="skeleton w-[52px] h-[52px] rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — neon-on-black focal point. Greeting derives from the real   */
/* client clock; everything else reflects the real `connected` state. */
/* ------------------------------------------------------------------ */
function Hero({ connected }) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7 sm:p-9 shadow-[var(--shadow-glow)] border border-[var(--neon)]/20"
      style={{ background: "radial-gradient(120% 140% at 100% 0%, rgba(198,255,74,0.16) 0%, transparent 55%), var(--surface)" }}
    >
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-[var(--neon)]/15 blur-3xl float-slow" />
      <div className="pointer-events-none absolute -bottom-20 left-10 w-72 h-72 rounded-full bg-[var(--cyan)]/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-6 flex-wrap">
        <div className="max-w-[440px]">
          <div className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wider text-[var(--neon)] mb-2">
            <Sparkles size={13} />
            {greeting}
          </div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[30px] leading-tight mb-2 text-[var(--ink)]">
            GhostLead is {connected ? "ready to respond" : "waking up"}.
          </h1>
          <p className="text-[14px] text-[var(--muted)] leading-relaxed">
            {connected
              ? "Your lead response engine is online and waiting for the next opportunity."
              : "Reconnecting to your lead response engine — this only takes a moment."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Ripples color="var(--neon)" />
            <div className="relative w-16 h-16 rounded-full bg-[var(--neon-dim)] border border-[var(--neon)]/40 backdrop-blur-sm flex items-center justify-center">
              <GhostMark mood={connected ? "awake" : "sleepy"} size={36} className="text-[var(--neon)] float" />
            </div>
          </div>
          <span className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full ${connected ? "bg-[var(--neon-dim)] text-[var(--neon)]" : "bg-[var(--surface-tint)] text-[var(--muted)]"}`}>
            {connected ? "Live" : "Connecting"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SystemStatus — deep gradient accent panel. Only shows signals the  */
/* app can genuinely observe: the SSE connection, and a real ping to  */
/* the backend's existing GET /health endpoint (no fabricated rows).  */
/* ------------------------------------------------------------------ */
function SystemStatus({ connected, apiHealthy }) {
  const rows = [
    { label: "Live lead feed", ok: connected === true, pending: connected !== true },
    { label: "Backend API", ok: apiHealthy === true, pending: apiHealthy === null, failed: apiHealthy === false },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-md)] border border-[var(--neon)]/15" style={{ background: "var(--grad-dark)" }}>
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
      <h2 className="relative text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] mb-4">System status</h2>
      <div className="relative space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--ink)]/85">{r.label}</span>
            <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide ${r.ok ? "text-[var(--neon)]" : r.failed ? "text-[var(--pink)]" : "text-[var(--amber)]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${r.ok ? "bg-[var(--neon)] pulse-dot" : r.failed ? "bg-[var(--pink)]" : "bg-[var(--amber)] pulse-dot"}`} />
              {r.ok ? "Operational" : r.failed ? "Unreachable" : "Checking…"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ActivityPanel — abstract decorative wave instead of a chart that   */
/* implies a data series that doesn't exist yet.                      */
/* ------------------------------------------------------------------ */
function ActivityPanel({ leadsCount }) {
  return (
    <div className="gl-card relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[16px] font-bold text-[var(--ink)]">Lead activity</h2>
        <span className="text-[11px] font-mono text-[var(--muted)]">{leadsCount} total this session</span>
      </div>
      <p className="text-[13px] text-[var(--muted)] mb-5">{leadsCount === 0 ? "No activity yet" : "Live session snapshot"}</p>

      <div className="relative h-32 rounded-xl overflow-hidden bg-[var(--surface-tint)] border border-[var(--border)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none" fill="none">
          <path d="M0 70 C 40 40, 80 85, 120 55 S 200 30, 240 60 S 320 85, 360 45 S 400 55, 400 55" stroke="var(--neon)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <path d="M0 55 C 40 75, 90 35, 130 60 S 210 80, 250 45 S 330 25, 400 50" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 8" className="dash-flow" opacity="0.55" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[12px] font-medium text-[var(--muted)] bg-[var(--surface)]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border)]">
            Your lead activity timeline will appear here once GhostLead starts receiving leads.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GhostLeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const [streamKey, setStreamKey] = useState(0);
  const [query, setQuery] = useState("");
  const [apiHealthy, setApiHealthy] = useState(null);

  // Live connection to the backend. `streamKey` lets the refresh button
  // force a clean re-subscribe without touching any backend behavior.
  useEffect(() => {
    setConnected(false);
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
  }, [streamKey]);

  // Real health check against the backend's existing GET /health route —
  // this is the actual signal behind the "System status" panel, not a
  // fabricated one.
  useEffect(() => {
    let cancelled = false;
    const checkHealth = () => {
      fetch(`${API_URL}/health`)
        .then((r) => {
          if (!cancelled) setApiHealthy(r.ok);
        })
        .catch(() => {
          if (!cancelled) setApiHealthy(false);
        });
    };
    checkHealth();
    const h = setInterval(checkHealth, 20000);
    return () => {
      cancelled = true;
      clearInterval(h);
    };
  }, [streamKey]);

  // Local clock, just to animate the countdown ring every second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(() => setStreamKey((k) => k + 1), []);

  const activeLead = leads.find((l) => l.status === "connecting");
  const lastResolved = leads.find((l) => l.status === "qualified" || l.status === "cold");
  const qualifiedCount = leads.filter((l) => l.status === "qualified").length;
  const resolved = leads.filter((l) => l.responseTimeSeconds != null);
  const avgResponse = resolved.length ? Math.round(resolved.reduce((a, l) => a + l.responseTimeSeconds, 0) / resolved.length) : 0;
  const qualificationRate = leads.length ? Math.round((qualifiedCount / leads.length) * 100) : null;

  const filteredLeads = query.trim()
    ? leads.filter(
        (l) => l.name?.toLowerCase().includes(query.trim().toLowerCase()) || l.source?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : leads;

  return (
    <div className="gl-root min-h-screen w-full relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <DesignTokens />

      {/* ambient neon atmosphere behind the whole page */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-[560px] h-[560px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #C6FF4A 0%, transparent 70%)" }} />
      <div className="pointer-events-none fixed top-0 -right-40 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #4AF1E8 0%, transparent 70%)" }} />
      <div className="pointer-events-none fixed bottom-[-10%] left-1/3 w-[460px] h-[460px] rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #C6FF4A 0%, transparent 70%)" }} />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6">
        <header className="py-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(198,255,74,0.4)]" style={{ background: "var(--grad-primary)" }}>
              <GhostMark mood={connected ? "awake" : "sleepy"} size={26} className="text-[#0A0B10] float" eyeColor="#F5F6FA" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-extrabold text-[21px] tracking-tight text-[var(--ink)]">GhostLead</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--neon)] bg-[var(--neon-dim)] px-2 py-0.5 rounded-full">Response Console</span>
              </div>
            </div>
          </div>
          <ConnectionBadge connected={connected} />
        </header>

        <div className="pb-6">
          <Hero connected={connected} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6">
          <MetricCard
            icon={<GhostMark mood="awake" size={17} eyeColor="#F5F6FA" />}
            label="Leads received"
            value={leads.length}
            caption={leads.length === 0 ? "Waiting for first lead" : `${resolved.length} resolved so far`}
            grad="var(--grad-primary)"
            accent="var(--neon)"
            loading={!connected}
          />
          <MetricCard
            icon={<ArrowUpRight size={16} />}
            label="Avg. response"
            value={resolved.length ? `${avgResponse}s` : "—"}
            caption={resolved.length ? `across ${resolved.length} response${resolved.length === 1 ? "" : "s"}` : "No responses yet"}
            grad="var(--grad-blue)"
            accent="var(--cyan)"
            loading={!connected}
          />
          <MetricCard
            icon={<Flame size={16} />}
            label="Qualified leads"
            value={qualifiedCount}
            caption={qualificationRate === null ? "No leads yet" : `${qualificationRate}% qualification rate`}
            grad="var(--grad-emerald)"
            accent="var(--neon)"
            loading={!connected}
          />
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 pb-4">
          <section className="gl-card rounded-2xl border border-[var(--border)] border-t-[3px] border-t-[var(--neon)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
              <div>
                <h2 className="font-display text-[17px] font-bold text-[var(--ink)]">Incoming leads</h2>
                <p className="text-[13px] text-[var(--muted)]">Recent opportunities</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-[var(--neon-dim)] text-[var(--neon)]">{leads.length}</span>
                <IconButton icon={RefreshCw} label="Reconnect live feed" onClick={handleRefresh} spinning={!connected} />
              </div>
            </div>

            {leads.length > 0 && (
              <div className="relative mt-4 mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or source…"
                  className="w-full text-[13px] pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink)] outline-none focus:border-[var(--neon)] focus:ring-2 focus:ring-[var(--neon-dim)] transition"
                />
              </div>
            )}

            <div className="space-y-2 mt-4">
              {!connected && leads.length === 0 && [0, 1, 2].map((i) => <LeadRowSkeleton key={i} />)}

              {connected && leads.length === 0 && (
                <EmptyState
                  mood="sleepy"
                  accent="var(--neon)"
                  accentBg="var(--neon-dim)"
                  title="No leads yet"
                  description={`GhostLead is listening for new opportunities. Once one arrives at ${API_URL}/api/leads, it'll appear here automatically.`}
                  action={<PrimaryButton onClick={handleRefresh}>Refresh leads</PrimaryButton>}
                />
              )}

              {leads.length > 0 && filteredLeads.length === 0 && (
                <EmptyState mood="faint" accent="var(--muted-2)" accentBg="var(--border)" title="No matches" description="No leads match that search." />
              )}

              {filteredLeads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} tick={tick} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="gl-card rounded-2xl border border-[var(--border)] border-t-[3px] border-t-[var(--cyan)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
              <h2 className="font-display text-[17px] font-bold text-[var(--ink)] mb-1">Live call</h2>
              <p className="text-[13px] text-[var(--muted)] mb-4">Active conversation</p>

              {activeLead ? (
                <div className="rounded-2xl p-4 bg-[var(--surface-tint)] border border-[var(--cyan)]/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-display font-semibold text-[16px] text-[var(--ink)]">{activeLead.name}</div>
                      <div className="text-[12px] text-[var(--muted)] font-mono">{activeLead.source} lead</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--cyan)] bg-[var(--cyan-bg)] px-2 py-1 rounded-full">
                      <Radio size={12} className="pulse-dot" /> on call
                    </div>
                  </div>
                  <div className="flex items-end gap-[3px] h-7 mb-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <span key={i} className="wave-bar w-[3px] rounded-full bg-[var(--cyan)]" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <p className="text-[13px] text-[var(--muted)] leading-snug">
                    CALL-E is on the phone with this lead now — gathering intent, timeline, and financing status. Results post here the moment the call ends.
                  </p>
                </div>
              ) : (
                <EmptyState
                  mood="sleepy"
                  accent="var(--cyan)"
                  accentBg="var(--cyan-bg)"
                  title="No active conversation"
                  description="GhostLead will show live call intelligence here the moment a lead conversation begins."
                />
              )}
            </div>

            {lastResolved && (
              <div className="gl-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] mb-3">
                  <PhoneCall size={12} />
                  Last result — {lastResolved.name}
                </div>
                {lastResolved.qualification ? (
                  <div className="space-y-2 text-[13px] text-[var(--ink)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: lastResolved.qualification.wants_to_proceed === "yes" ? "var(--neon)" : "var(--muted-2)" }} />
                      Wants to proceed: {lastResolved.qualification.wants_to_proceed}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: "var(--muted-2)" }} />
                      Timeline: {lastResolved.qualification.timeline}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: "var(--muted-2)" }} />
                      Financing in place: {lastResolved.qualification.financing_in_place}
                    </div>
                    {lastResolved.qualification.notes && <p className="text-[var(--muted)] mt-2 text-[12px] leading-snug">{lastResolved.qualification.notes}</p>}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--muted)]">{lastResolved.transcriptSummary || "No structured result returned for this call."}</p>
                )}
              </div>
            )}

            <SystemStatus connected={connected} apiHealthy={apiHealthy} />
          </section>
        </div>

        <div className="pb-10">
          <ActivityPanel leadsCount={leads.length} />
        </div>
      </div>
    </div>
  );
}
