/* ---------- Analytics ---------- */
function Analytics() {
  const [stats, setStats] = React.useState(null);
  const [activityData, setActivityData] = React.useState(TENDER_ACTIVITY_MONTH);

  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    API.getAnalytics().then(d => {
      if (d.stats) setStats(d.stats);
      if (d.activity_by_month && d.activity_by_month.length) {
        setActivityData(d.activity_by_month.map(m => ({ m: m.month, uploaded: m.uploaded, won: m.won, lost: m.lost })));
      }
    }).catch(() => {});
  }, []);

  const activeTenders = stats ? stats.active_tenders : 13;
  const avgScore = stats ? stats.avg_match_score : 76;
  const vaultScore = stats ? stats.vault_completeness : 82;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        subtitle="Pipeline performance, compliance trends and AI usage across your workspace."
        actions={
          <>
            <button className="btn btn-sm" onClick={() => window.toast && toast("Custom date ranges are coming soon. Showing the last 6 months.")}><Icon.calendar size={13}/> Last 6 months</button>
            <button className="btn btn-sm" onClick={() => {
              const rows = [["Metric","Value"],
                ["Active tenders", activeTenders],
                ["Avg bid readiness %", avgScore],
                ["Vault completeness %", vaultScore]];
              activityData.forEach(m => rows.push([`Activity ${m.m} (uploaded/won)`, `${m.uploaded}/${m.won}`]));
              const csv = rows.map(r => r.map(c => `"${String(c)}"`).join(",")).join("\n");
              window.downloadBlob(new Blob([csv], { type: "text/csv" }), "tenderpilot-analytics.csv");
            }}><Icon.download size={13}/> Export</button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid g-4">
        <KPI label="Active tenders" value={String(activeTenders)} delta="+3" deltaDir="up" spark={[6,7,8,9,9,11,11,12,13,activeTenders]}/>
        <KPI label="Avg bid readiness" value={avgScore + "%"} delta="+9 pts" deltaDir="up" spark={[58,60,63,67,68,70,72,74,75,avgScore]}/>
        <KPI label="Vault completeness" value={vaultScore + "%"} delta="+14 pts" deltaDir="up" spark={[55,58,62,64,67,71,73,75,78,vaultScore]}/>
        <KPI label="AI hours saved" value="284" delta="+62" deltaDir="up" spark={[20,30,45,50,70,90,110,130,160,180]}/>
      </div>

      {/* Charts row 1 */}
      <div className="grid g-2" style={{ marginTop: 16 }}>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Tender pipeline value</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Cumulative contract value across stages</div>
            </div>
            <span className="chip emerald"><Icon.trending size={10}/>+38% MoM</span>
          </div>
          <AreaChart/>
        </div>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Win probability distribution</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Where your active tenders sit on the readiness curve</div>
            </div>
          </div>
          <ProbabilityChart/>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid g-3" style={{ marginTop: 16 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Tenders by sector</div>
          <DonutChart segments={[
            { l: "Government IT", v: 32, c: "var(--emerald)" },
            { l: "Construction", v: 18, c: "var(--amber)" },
            { l: "Security", v: 22, c: "var(--blue)" },
            { l: "Services", v: 15, c: "var(--violet)" },
            { l: "Other", v: 13, c: "var(--text-3)" },
          ]}/>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Top issuers (by submitted)</div>
          <div className="col gap-3">
            {[
              { name: "South African Revenue Service", val: 9, win: 4 },
              { name: "Eskom Holdings SOC", val: 7, win: 3 },
              { name: "Transnet SOC Ltd", val: 5, win: 2 },
              { name: "City of Johannesburg", val: 4, win: 1 },
              { name: "Dept. of Public Works", val: 3, win: 0 },
            ].map((r, i) => (
              <div key={i}>
                <div className="between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5 }}>{r.name}</span>
                  <span className="mono tnum" style={{ fontSize: 11 }}>{r.win}/{r.val}</span>
                </div>
                <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 999, overflow: "hidden", background: "var(--surface-2)" }}>
                  <div style={{ width: `${(r.win/r.val)*100}%`, background: "var(--emerald)" }}/>
                  <div style={{ width: `${((r.val-r.win)/r.val)*100}%`, background: "var(--border-strong)" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Compliance trend</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
            <div className="tnum" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em" }}>{vaultScore}</div>
            <div className="chip emerald" style={{ fontSize: 10 }}>+14 pts</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>this quarter</div>
          </div>
          <Sparkline data={[55,58,62,64,67,71,73,75,78,80,vaultScore,vaultScore]} width={300} height={80} color="var(--emerald)"/>
          <div className="divider" style={{ margin: "14px 0" }}/>
          <div className="col gap-2" style={{ fontSize: 12 }}>
            <div className="between"><span className="muted">Tax & financial</span><span className="mono tnum">96%</span></div>
            <div className="between"><span className="muted">B-BBEE</span><span className="mono tnum">85%</span></div>
            <div className="between"><span className="muted">SBD forms</span><span className="mono tnum">62%</span></div>
            <div className="between"><span className="muted">Insurance</span><span className="mono tnum">88%</span></div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="between" style={{ padding: "14px 18px" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Monthly tender activity</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Uploaded vs won, last 6 months</div>
          </div>
          <div className="row gap-2">
            <span className="chip"><span className="chip-dot" style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}/>Uploaded</span>
            <span className="chip emerald"><span className="chip-dot"/>Won</span>
          </div>
        </div>
        <div style={{ padding: "0 18px 18px" }}>
          <MonthBars data={activityData} height={220}/>
        </div>
      </div>
    </div>
  );
}

function AreaChart() {
  const data = [40,42,52,58,68,72,78,82,88,92];
  const w = 560, h = 200;
  const max = Math.max(...data), min = 0;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - 16 - ((v - min) / (max - min)) * (h - 36)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 220 }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--emerald)" stopOpacity=".25"/>
            <stop offset="100%" stopColor="var(--emerald)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,3].map(i => (
          <line key={i} x1="0" x2={w} y1={20 + i * 50} y2={20 + i * 50} stroke="var(--border)" strokeDasharray="2 4"/>
        ))}
        <path d={`${d} L${w},${h-16} L0,${h-16} Z`} fill="url(#ag)"/>
        <path d={d} fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => i % 2 === 0 && (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--surface)" stroke="var(--emerald)" strokeWidth="2"/>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-3)" }}>
        {["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"].map((m,i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  );
}

function ProbabilityChart() {
  const buckets = [
    { l: "0–20%", v: 1, c: "var(--red)" },
    { l: "20–40%", v: 2, c: "var(--red)" },
    { l: "40–60%", v: 3, c: "var(--amber)" },
    { l: "60–80%", v: 5, c: "var(--amber)" },
    { l: "80–100%", v: 3, c: "var(--emerald)" },
  ];
  const max = Math.max(...buckets.map(b => b.v));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${buckets.length}, 1fr)`, gap: 14, alignItems: "end", height: 200 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div className="mono tnum" style={{ fontSize: 11, color: "var(--text-2)" }}>{b.v}</div>
            <div style={{ width: "100%", maxWidth: 56, height: (b.v / max) * 140 + 4, background: b.c, borderRadius: 4, opacity: .85 }}/>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{b.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.v, 0);
  const r = 56, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="rotate(-90 70 70)">
          {segments.map((s, i) => {
            const dash = (s.v / total) * c;
            const el = <circle key={i} cx="70" cy="70" r={r} stroke={s.c} strokeWidth="14" fill="none"
                       strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}/>;
            offset += dash;
            return el;
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--text)" style={{ letterSpacing: "-0.02em" }}>{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="var(--text-3)" style={{ letterSpacing: ".08em" }}>TENDERS</text>
      </svg>
      <div className="col gap-2" style={{ flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c }}/>
            <span style={{ flex: 1, color: "var(--text-2)" }}>{s.l}</span>
            <span className="mono tnum" style={{ fontSize: 11 }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Analytics });
