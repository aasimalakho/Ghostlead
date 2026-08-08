// LIVE MODE — this component connects to the real GhostLead backend via
// Server-Sent Events (src/routes/leads.ts -> GET /api/leads/stream) and
// renders whatever leads actually exist, in their real CALL-E-reported
// state. No mock data generator here anymore.
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight, Flame, Radio, RefreshCw, Search, PhoneCall } from "lucide-react";

// Vite bakes VITE_* vars in at build time — set VITE_API_URL in your host's
// env vars (Render: Static Site -> Environment) and rebuild for it to apply.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ================================================================== */
/* Design tokens — kept as CSS custom properties so every component   */
/* below pulls from one palette instead of scattering hex values.     */
/* ================================================================== */
function DesignTokens() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      .gl-root {
        --bg: #F7F6FC;
        --surface: #FFFFFF;
        --surface-tint: #FAF9FF;
        --border: #E4DEF6;
        --border-strong: #D3C9F4;
        --ink: #1E1B34;
        --muted: #746E93;
        --muted-2: #9992B8;
        --primary: #6D5AE6;
        --primary-dark: #5343D6;
        --primary-light: #8C7CF2;
        --primary-bg: #EEEAFF;
        --emerald: #0F9D6F;
        --emerald-bg: #DCFBEE;
        --blue: #2F7FE0;
        --blue-bg: #E1EEFF;
        --amber: #C2790A;
        --amber-bg: #FDECC8;
        --red: #DC3A56;
        --red-bg: #FDE2E7;
        --grad-primary: linear-gradient(135deg, #8674F0 0%, #5B4CDE 100%);
        --shadow-sm: 0 1px 2px rgba(30,27,52,0.05);
        --shadow-md: 0 6px 20px rgba(93,79,224,0.10);
        --shadow-lift: 0 16px 32px rgba(93,79,224,0.16);
      }

      .font-display { font-family: 'Baloo 2', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }

      @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }

      @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .rise { animation: rise .35s ease-out; }

      @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      .float { animation: float 3.2s ease-in-out infinite; }

      @keyframes glow-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(15,157,111,0.35); } 50% { box-shadow: 0 0 0 5px rgba(15,157,111,0); } }
      .glow-ring { animation: glow-ring 1.8s ease-out infinite; }

      @keyframes wave { 0%,100% { height: 30%; } 50% { height: 100%; } }
      .wave-bar { animation: wave 1s ease-in-out infinite; }

      @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
      .skeleton {
        background: linear-gradient(90deg, #EFEBFC 25%, #F7F5FF 37%, #EFEBFC 63%);
        background-size: 400px 100%;
        animation: shimmer 1.4s ease-in-out infinite;
      }

      .gl-card {
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }
      .gl-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lift);
        border-color: var(--border-strong);
      }

      .gl-btn { transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease; }
      .gl-btn:hover { transform: translateY(-1px); }
      .gl-btn:active { transform: translateY(0); }

      ::selection { background: #6D5AE6; color: #FFFFFF; }
      input::placeholder { color: var(--muted-2); }
    `}</style>
  );
}

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

/* ------------------------------------------------------------------ */
/* Buttons — one primary (gradient), one secondary (outline), one     */
/* icon-only, shared across the dashboard.                            */
/* ------------------------------------------------------------------ */
function PrimaryButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`gl-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(93,79,224,0.32)] hover:shadow-[0_8px_20px_rgba(93,79,224,0.4)] ${className}`}
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
      className={`gl-btn w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--surface-tint)] hover:text-[var(--primary)] hover:border-[var(--border-strong)] ${className}`}
    >
      <Icon size={15} className={spinning ? "animate-spin" : ""} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ConnectionBadge — communicates live SSE state at a glance.         */
/* ------------------------------------------------------------------ */
function ConnectionBadge({ connected }) {
  if (connected) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium px-3 py-1.5 rounded-full text-[var(--emerald)] bg-[var(--emerald-bg)]">
        <span className="relative flex w-2 h-2">
          <span className="w-2 h-2 rounded-full bg-[var(--emerald)] glow-ring" />
        </span>
        Connected
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium px-3 py-1.5 rounded-full text-[var(--amber)] bg-[var(--amber-bg)]">
      <span className="w-2 h-2 rounded-full bg-[var(--amber)] pulse-dot" />
      Connecting…
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MetricCard — rich stat card with icon chip + contextual caption.   */
/* Never shows a number the app didn't actually compute.              */
/* ------------------------------------------------------------------ */
function MetricCard({ icon, label, value, caption, tint, accent, loading }) {
  return (
    <div className="gl-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: tint, color: accent }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">{label}</span>
      </div>
      {loading ? (
        <>
          <div className="skeleton h-8 w-20 rounded-lg mb-2" />
          <div className="skeleton h-3 w-32 rounded" />
        </>
      ) : (
        <>
          <div className="font-display font-bold text-[32px] leading-none mb-1.5" style={{ color: accent }}>
            {value}
          </div>
          <div className="text-[13px] text-[var(--muted)]">{caption}</div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState — reusable, designed placeholder for any section that   */
/* currently has nothing real to show.                                */
/* ------------------------------------------------------------------ */
function EmptyState({ mood = "sleepy", title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-tint)] p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-[var(--shadow-sm)]">
        <GhostMark mood={mood} size={30} className="text-[var(--primary-light)] float" />
      </div>
      <div className="font-display font-semibold text-[15px] text-[var(--ink)]">{title}</div>
      <p className="text-[13px] text-[var(--muted)] max-w-[320px] leading-snug">{description}</p>
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
        background: `conic-gradient(${urgent ? "var(--red)" : "var(--primary)"} ${deg}deg, var(--primary-bg) ${deg}deg)`,
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
    new: { label: "Ringing in", cls: "text-[var(--amber)] bg-[var(--amber-bg)]" },
    connecting: { label: "On call", cls: "text-[var(--primary)] bg-[var(--primary-bg)]" },
    qualified: { label: "Qualified", cls: "text-[var(--emerald)] bg-[var(--emerald-bg)]" },
    cold: { label: "Ghosted", cls: "text-[var(--muted)] bg-[var(--border)]" },
    error: { label: "Call failed", cls: "text-[var(--red)] bg-[var(--red-bg)]" },
  };
  const m = map[status] || map.new;
  return (
    <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

const STATUS_BAR_COLOR = {
  new: "var(--amber)",
  connecting: "var(--primary)",
  qualified: "var(--emerald)",
  cold: "var(--muted-2)",
  error: "var(--red)",
};

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
    <div
      className="rise gl-card flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] relative overflow-hidden"
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: STATUS_BAR_COLOR[lead.status] || "var(--border-strong)" }}
      />
      {lead.status === "new" ? (
        <div className="relative ml-1">
          <ResponseRing pct={(countdown / 60) * 100} urgent={urgent} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-[var(--ink)]">
            {countdown}
          </span>
        </div>
      ) : (
        <div className="ml-1 w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[var(--surface-tint)] shrink-0">
          {lead.status === "qualified" && <GhostMark mood="happy" size={30} className="text-[var(--emerald)]" />}
          {(lead.status === "cold" || lead.status === "error") && (
            <GhostMark mood="faint" size={30} className="text-[var(--muted-2)]" />
          )}
          {lead.status === "connecting" && <GhostMark mood="oncall" size={30} className="text-[var(--primary)] pulse-dot" />}
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
            <span className="text-[11px] font-mono text-[var(--muted)]">
              connected in {lead.responseTimeSeconds}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-white">
      <div className="skeleton w-[52px] h-[52px] rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ActivityPanel — uses the previously-empty space below the fold.    */
/* Never fabricates a data series; this project doesn't currently     */
/* track a leads-per-day history, so it renders a designed empty      */
/* state instead of an invented chart.                                */
/* ------------------------------------------------------------------ */
function ActivityPanel({ leadsCount }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="gl-card rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[15px] font-semibold text-[var(--ink)]">Lead activity</h2>
        <span className="text-[11px] font-mono text-[var(--muted)]">{leadsCount} total this session</span>
      </div>
      <p className="text-[13px] text-[var(--muted)] mb-5">Response trends will populate as leads arrive.</p>

      <div className="relative h-28 rounded-xl bg-[var(--surface-tint)] border border-dashed border-[var(--border-strong)] flex items-end justify-between px-6 pb-6 pt-4 overflow-hidden">
        <svg className="absolute inset-x-6 top-4 bottom-6" viewBox="0 0 300 60" preserveAspectRatio="none" fill="none">
          <path
            d="M0 45 Q 25 40, 50 44 T 100 40 T 150 46 T 200 38 T 250 42 T 300 36"
            stroke="var(--border-strong)"
            strokeWidth="2"
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
        </svg>
        {days.map((d) => (
          <span key={d} className="relative text-[10px] font-mono uppercase text-[var(--muted-2)]">
            {d}
          </span>
        ))}
      </div>
      <p className="text-center text-[12px] text-[var(--muted-2)] mt-3">Lead activity will appear here once GhostLead starts receiving leads.</p>
    </div>
  );
}

export default function GhostLeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const [streamKey, setStreamKey] = useState(0);
  const [query, setQuery] = useState("");

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
  const avgResponse = resolved.length
    ? Math.round(resolved.reduce((a, l) => a + l.responseTimeSeconds, 0) / resolved.length)
    : 0;
  const qualificationRate = leads.length ? Math.round((qualifiedCount / leads.length) * 100) : null;

  const filteredLeads = query.trim()
    ? leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(query.trim().toLowerCase()) ||
          l.source?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : leads;

  return (
    <div
      className="gl-root min-h-screen w-full relative overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <DesignTokens />

      {/* ambient mist — signature background touch */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[440px] h-[440px] rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #E3DBFF 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute top-52 -right-32 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #D6EAFF 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #D2F7EC 0%, transparent 70%)" }} />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <header className="py-5 flex items-center justify-between gap-3 flex-wrap border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(93,79,224,0.35)]"
              style={{ background: "var(--grad-primary)" }}
            >
              <GhostMark mood={connected ? "awake" : "sleepy"} size={24} className="text-white float" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[20px] tracking-tight">GhostLead</span>
                <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-bg)] px-2 py-0.5 rounded-full">
                  Response Console
                </span>
              </div>
              <span className="sm:hidden text-[12px] text-[var(--muted)]">Response Console</span>
            </div>
          </div>
          <ConnectionBadge connected={connected} />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
          <MetricCard
            icon={<GhostMark mood="awake" size={16} />}
            label="Leads received"
            value={leads.length}
            caption={leads.length === 0 ? "Waiting for first lead" : `${resolved.length} resolved so far`}
            tint="var(--primary-bg)"
            accent="var(--primary)"
            loading={!connected}
          />
          <MetricCard
            icon={<ArrowUpRight size={15} />}
            label="Avg. response time"
            value={resolved.length ? `${avgResponse}s` : "—"}
            caption={resolved.length ? `across ${resolved.length} response${resolved.length === 1 ? "" : "s"}` : "No responses yet"}
            tint="var(--blue-bg)"
            accent="var(--blue)"
            loading={!connected}
          />
          <MetricCard
            icon={<Flame size={15} />}
            label="Qualified"
            value={qualifiedCount}
            caption={qualificationRate === null ? "No leads yet" : `${qualificationRate}% qualification rate`}
            tint="var(--emerald-bg)"
            accent="var(--emerald)"
            loading={!connected}
          />
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 pb-4">
          <section className="gl-card rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
              <div>
                <h2 className="font-display text-[16px] font-semibold text-[var(--ink)]">Leads</h2>
                <p className="text-[13px] text-[var(--muted)]">Recent incoming opportunities</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-[var(--primary-bg)] text-[var(--primary)]">
                  {leads.length}
                </span>
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
                  className="w-full text-[13px] pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] outline-none focus:border-[var(--primary-light)] focus:ring-2 focus:ring-[var(--primary-bg)] transition"
                />
              </div>
            )}

            <div className="space-y-2 mt-4">
              {!connected &&
                leads.length === 0 &&
                [0, 1, 2].map((i) => <LeadRowSkeleton key={i} />)}

              {connected && leads.length === 0 && (
                <EmptyState
                  mood="sleepy"
                  title="No leads yet"
                  description={`Your incoming leads will appear here automatically. POST one to ${API_URL}/api/leads and GhostLead will start processing it within seconds.`}
                  action={<PrimaryButton onClick={handleRefresh}>Refresh leads</PrimaryButton>}
                />
              )}

              {leads.length > 0 && filteredLeads.length === 0 && (
                <EmptyState mood="faint" title="No matches" description="No leads match that search." />
              )}

              {filteredLeads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} tick={tick} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="gl-card rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <h2 className="font-display text-[16px] font-semibold text-[var(--ink)] mb-1">Active call</h2>
              <p className="text-[13px] text-[var(--muted)] mb-4">Live conversation status</p>

              {activeLead ? (
                <div className="rounded-2xl border border-[var(--primary-bg)] bg-[var(--primary-bg)]/40 p-4" style={{ background: "linear-gradient(180deg, #F3F0FF 0%, #FFFFFF 100%)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-display font-semibold text-[16px]">{activeLead.name}</div>
                      <div className="text-[12px] text-[var(--muted)] font-mono">{activeLead.source} lead</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--primary)] bg-white px-2 py-1 rounded-full">
                      <Radio size={12} className="pulse-dot" /> on call
                    </div>
                  </div>
                  <div className="flex items-end gap-[3px] h-6 mb-3">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <span
                        key={i}
                        className="wave-bar w-[3px] rounded-full bg-[var(--primary)]"
                        style={{ animationDelay: `${i * 0.11}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] text-[var(--muted)] leading-snug">
                    CALL-E is on the phone with this lead now — gathering intent, timeline,
                    and financing status. Results post here the moment the call ends.
                  </p>
                </div>
              ) : (
                <EmptyState
                  mood="sleepy"
                  title="No active call"
                  description="Your next live lead conversation will appear here the moment CALL-E dials out."
                />
              )}
            </div>

            {lastResolved && (
              <div className="gl-card rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] mb-3">
                  <PhoneCall size={12} />
                  Last result — {lastResolved.name}
                </div>
                {lastResolved.qualification ? (
                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: lastResolved.qualification.wants_to_proceed === "yes" ? "var(--emerald)" : "var(--muted-2)" }}
                      />
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
                    {lastResolved.qualification.notes && (
                      <p className="text-[var(--muted)] mt-2 text-[12px] leading-snug">
                        {lastResolved.qualification.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--muted)]">
                    {lastResolved.transcriptSummary || "No structured result returned for this call."}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="pb-8">
          <ActivityPanel leadsCount={leads.length} />
        </div>
      </div>
    </div>
  );
}
