/* ---------- Shared UI primitives ---------- */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const cx = (...a) => a.filter(Boolean).join(" ");

/* ---------- Chip / Status pill ---------- */
function StatusChip({ status }) {
  const map = {
    "valid":      { tone: "emerald", label: "Valid", dot: true },
    "expiring":   { tone: "amber",   label: "Expiring soon", dot: true },
    "expired":    { tone: "red",     label: "Expired", dot: true },
    "missing":    { tone: "red",     label: "Missing", dot: true },
    "pass":       { tone: "emerald", label: "Compliant" },
    "warn":       { tone: "amber",   label: "Caution" },
    "fail":       { tone: "red",     label: "Non-compliant" },
    "in-review":  { tone: "blue",    label: "In review" },
    "draft":      { tone: "",        label: "Draft" },
    "shortlisted":{ tone: "emerald", label: "Shortlisted" },
    "flagged":    { tone: "red",     label: "Flagged" },
    "approved":   { tone: "emerald", label: "Approved" },
    "ai-draft":   { tone: "violet",  label: "AI draft" },
    "auto":       { tone: "blue",    label: "Auto-generated" },
  };
  const c = map[status] || { tone: "", label: status };
  return (
    <span className={cx("chip", c.tone)}>
      {c.dot && <span className="chip-dot"/>}
      {c.label}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = {
    low:    { tone: "emerald", label: "Low risk" },
    medium: { tone: "amber", label: "Medium risk" },
    high:   { tone: "red", label: "High risk" },
  };
  const c = map[risk] || map.low;
  return <span className={cx("chip", c.tone)}><span className="chip-dot"/>{c.label}</span>;
}

/* ---------- Progress ring ---------- */
function Ring({ value = 0, size = 96, stroke = 8, color, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const col = color || (value >= 80 ? "var(--emerald)" : value >= 60 ? "var(--amber)" : "var(--red)");
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={col} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)" }}/>
      </svg>
      <div className="ring-label">
        <div style={{ fontSize: size*0.26, fontWeight: 600, letterSpacing: "-0.02em" }}>{value}</div>
        {label && <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

/* ---------- Linear progress ---------- */
function Bar({ value, color, height = 6 }) {
  const col = color || "var(--emerald)";
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", background: col, borderRadius: 999,
        transition: "width .8s cubic-bezier(.2,.7,.2,1)"
      }}/>
    </div>
  );
}

/* ---------- Sparkline ---------- */
function Sparkline({ data, color = "var(--emerald)", height = 36, width = 120, fill = true }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fillPath = `${d} L${width},${height} L0,${height} Z`;
  const gradId = "sp" + Math.random().toString(36).slice(2);
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${gradId})`}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ---------- Bar chart (months) ---------- */
function MonthBars({ data, height = 200 }) {
  const max = Math.max(...data.map(d => d.uploaded));
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 14, alignItems: "end", height, padding: "12px 6px 28px" }}>
      {data.map((d, i) => {
        const u = (d.uploaded / max) * (height - 60);
        const w = (d.won / max) * (height - 60);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", maxWidth: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", height: u, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, position: "relative" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: w, background: "var(--emerald)", borderRadius: 4 }}/>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{d.m}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Avatar / Avatar group ---------- */
function Avatar({ name, color, size = 28 }) {
  const initials = name.split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();
  const palette = ["#047857","#1D4ED8","#B45309","#6D28D9","#0B1220","#0891B2"];
  const c = color || palette[name.charCodeAt(0) % palette.length];
  return (
    <div className="avatar" style={{ background: c, width: size, height: size, fontSize: size * 0.42 }}>{initials}</div>
  );
}
function AvatarGroup({ names, max = 4 }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div style={{ display: "inline-flex" }}>
      {shown.map((n, i) => (
        <div key={i} style={{ marginLeft: i ? -8 : 0 }}>
          <Avatar name={n}/>
        </div>
      ))}
      {extra > 0 && <div style={{ marginLeft: -8 }} className="avatar" style={{ marginLeft: -8, background: "var(--surface-2)", color: "var(--text-2)" }}>+{extra}</div>}
    </div>
  );
}

/* ---------- Heatmap cells ---------- */
function Heatmap({ rows, cols, getValue }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${cols.length}, 1fr)`, gap: 4 }}>
      <div></div>
      {cols.map((c, i) => <div key={i} style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", textAlign: "center" }}>{c}</div>)}
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div style={{ fontSize: 11, color: "var(--text-2)", padding: "4px 0" }}>{r}</div>
          {cols.map((c, ci) => {
            const v = getValue(ri, ci);
            const op = 0.12 + v * 0.65;
            return <div key={ci} style={{
              height: 22, borderRadius: 4, background: `rgba(4,120,87,${op})`,
              border: "1px solid rgba(4,120,87,.18)"
            }}/>;
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- AI typing dots ---------- */
function TypingDots() {
  return (
    <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} className="pulse-dot" style={{
          width: 6, height: 6, borderRadius: 999, background: "var(--text-3)",
          animationDelay: `${i * .18}s`
        }}/>
      ))}
    </div>
  );
}

/* ---------- AI processing bar ---------- */
function AIBar() {
  return (
    <div style={{ position: "relative", overflow: "hidden", height: 3, borderRadius: 999, background: "var(--surface-2)" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent, var(--emerald), transparent)",
        width: "30%", animation: "ai-bar 1.6s linear infinite"
      }}/>
    </div>
  );
}

/* ---------- Section / Page header ---------- */
function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6, fontWeight: 600 }}>{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

/* ---------- KPI Card ---------- */
function KPI({ label, value, delta, deltaDir = "up", spark, accent }) {
  return (
    <div className="card kpi">
      <div className="between">
        <div className="label">{label}</div>
        {accent && <div className={cx("chip", accent)} style={{ padding: "2px 7px" }}>
          <span className="chip-dot"/>live</div>}
      </div>
      <div className="value tnum">{value}</div>
      {delta && (
        <div className={cx("delta", deltaDir)}>
          {deltaDir === "up" ? <Icon.trending size={12}/> : <Icon.trendDown size={12}/>}
          <span className="tnum mono">{delta}</span>
          <span className="muted-2" style={{ fontSize: 11.5, marginLeft: 2 }}>vs last month</span>
        </div>
      )}
      {spark && <div className="spark"><Sparkline data={spark} width={180} height={28}/></div>}
    </div>
  );
}

Object.assign(window, {
  cx, StatusChip, RiskBadge, Ring, Bar, Sparkline, MonthBars,
  Avatar, AvatarGroup, Heatmap, TypingDots, AIBar, PageHeader, KPI,
});
