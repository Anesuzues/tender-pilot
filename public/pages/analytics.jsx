/* ---------- Analytics ---------- */
function Analytics() {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [stats, setStats] = React.useState(null);
  const [activityData, setActivityData] = React.useState([]);
  const [byStatus, setByStatus] = React.useState({});
  const [byProvince, setByProvince] = React.useState({});
  const [tenders, setTenders] = React.useState([]);
  const [docs, setDocs] = React.useState([]);
  const [loaded, setLoaded] = React.useState(!isLoggedIn);

  React.useEffect(() => {
    if (!isLoggedIn) { setLoaded(true); return; }
    API.getAnalytics().then(d => {
      if (d.stats) setStats(d.stats);
      if (d.activity_by_month) setActivityData(d.activity_by_month.map(m => ({ m: m.month, uploaded: m.uploaded, won: m.won, lost: m.lost })));
      if (d.tenders_by_status) setByStatus(d.tenders_by_status);
      if (d.tenders_by_province) setByProvince(d.tenders_by_province);
    }).catch(() => {}).finally(() => setLoaded(true));
    API.getTenders({ limit: 200 }).then(r => setTenders(r.items || [])).catch(() => {});
    API.getDocuments().then(list => setDocs(list || [])).catch(() => {});
  }, []);

  const activeTenders = stats ? stats.active_tenders : tenders.length;
  const avgScore = stats ? stats.avg_match_score : (tenders.length ? Math.round(tenders.reduce((s, t) => s + (t.score || 0), 0) / tenders.length) : 0);
  const vaultScore = stats ? stats.vault_completeness : 0;
  const openProposals = stats ? stats.open_proposals : 0;

  // Real win-probability buckets from actual tender scores
  const scored = tenders.filter(t => t.score != null);
  const bucketsDef = [
    { l: "0–20%", lo: 0, hi: 20, c: "var(--red)" },
    { l: "20–40%", lo: 20, hi: 40, c: "var(--red)" },
    { l: "40–60%", lo: 40, hi: 60, c: "var(--amber)" },
    { l: "60–80%", lo: 60, hi: 80, c: "var(--amber)" },
    { l: "80–100%", lo: 80, hi: 101, c: "var(--emerald)" },
  ];
  const probBuckets = bucketsDef.map(b => ({ l: b.l, c: b.c, v: scored.filter(t => t.score >= b.lo && t.score < b.hi).length }));

  // Real "tenders by status" donut
  const statusColors = { "in-review": "var(--blue)", draft: "var(--text-3)", shortlisted: "var(--emerald)", flagged: "var(--amber)", archived: "var(--violet)" };
  const statusSegments = Object.entries(byStatus).map(([k, v]) => ({ l: k.replace("-", " "), v, c: statusColors[k] || "var(--text-3)" })).filter(s => s.v > 0);

  // Real "top issuers" from tender data
  const issuerCounts = {};
  tenders.forEach(t => { if (t.issuer) issuerCounts[t.issuer] = (issuerCounts[t.issuer] || 0) + 1; });
  const topIssuers = Object.entries(issuerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, val]) => ({ name, val }));

  // Real compliance category coverage
  const catPct = (cat) => {
    const found = docs.filter(d => d.category === cat);
    if (!found.length) return 0;
    if (found.some(d => d.status === "expired")) return 40;
    if (found.some(d => d.status === "expiring")) return 70;
    return 100;
  };
  const compCats = [
    { l: "Tax & financial", v: catPct("Tax") },
    { l: "B-BBEE", v: catPct("B-BBEE") },
    { l: "SBD forms", v: catPct("SBD Forms") },
    { l: "Insurance", v: catPct("Insurance") },
  ];

  const hasData = tenders.length > 0 || (stats && activeTenders > 0);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        subtitle="Pipeline performance and compliance across your workspace."
        actions={
          <>
            <button className="btn btn-sm" onClick={() => {
              const rows = [["Metric","Value"],
                ["Active tenders", activeTenders],
                ["Avg bid readiness %", avgScore],
                ["Vault completeness %", vaultScore],
                ["Open proposals", openProposals]];
              activityData.forEach(m => rows.push([`Activity ${m.m} (uploaded/won)`, `${m.uploaded}/${m.won}`]));
              const csv = rows.map(r => r.map(c => `"${String(c)}"`).join(",")).join("\n");
              window.downloadBlob(new Blob([csv], { type: "text/csv" }), "tenderpilot-analytics.csv");
            }}><Icon.download size={13}/> Export</button>
          </>
        }
      />

      {loaded && !hasData ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center", color: "var(--text-3)" }}>
          <Icon.chart size={26} style={{ opacity: .4, marginBottom: 12 }}/>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>No analytics yet</div>
          <div style={{ fontSize: 12.5, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            Your reports populate as you add tenders and compliance documents. Charts reflect only your real workspace data.
          </div>
        </div>
      ) : (
        <>
          {/* KPIs — real */}
          <div className="grid g-4">
            <KPI label="Active tenders" value={String(activeTenders)}/>
            <KPI label="Avg bid readiness" value={avgScore ? avgScore + "%" : "—"}/>
            <KPI label="Vault completeness" value={vaultScore ? vaultScore + "%" : "—"}/>
            <KPI label="Open proposals" value={String(openProposals)}/>
          </div>

          {/* Charts row 1 — real */}
          <div className="grid g-2" style={{ marginTop: 16 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Bid readiness distribution</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 14 }}>Where your tenders sit on the readiness curve</div>
              {scored.length ? <ProbabilityChart buckets={probBuckets}/> : <EmptyChart label="No scored tenders yet"/>}
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Tenders by status</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 14 }}>Distribution across your pipeline</div>
              {statusSegments.length ? <DonutChart segments={statusSegments}/> : <EmptyChart label="No tenders yet"/>}
            </div>
          </div>

          {/* Charts row 2 — real */}
          <div className="grid g-2" style={{ marginTop: 16 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Top issuers</div>
              {topIssuers.length ? (
                <div className="col gap-3">
                  {topIssuers.map((r, i) => (
                    <div key={i}>
                      <div className="between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 12.5 }}>{r.name}</span>
                        <span className="mono tnum" style={{ fontSize: 11 }}>{r.val}</span>
                      </div>
                      <Bar value={(r.val / topIssuers[0].val) * 100} color="var(--emerald)"/>
                    </div>
                  ))}
                </div>
              ) : <EmptyChart label="No issuers yet"/>}
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Compliance coverage</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <div className="tnum" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em" }}>{vaultScore}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>% overall</div>
              </div>
              <div className="col gap-2" style={{ fontSize: 12 }}>
                {compCats.map(c => (
                  <div key={c.l}>
                    <div className="between" style={{ marginBottom: 4 }}><span className="muted">{c.l}</span><span className="mono tnum">{c.v}%</span></div>
                    <Bar value={c.v} color={c.v >= 100 ? "var(--emerald)" : c.v >= 70 ? "var(--amber)" : "var(--red)"}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly activity — real */}
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
              {activityData.some(m => m.uploaded || m.won) ? (
                <MonthBars data={activityData} height={220}/>
              ) : (
                <div style={{ height: 200, display: "grid", placeItems: "center", color: "var(--text-3)", fontSize: 12.5 }}>Activity builds as you upload and win tenders.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div style={{ height: 180, display: "grid", placeItems: "center", color: "var(--text-3)", fontSize: 12.5 }}>{label}</div>
  );
}

function ProbabilityChart({ buckets }) {
  const max = Math.max(1, ...buckets.map(b => b.v));
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
  const total = segments.reduce((a, s) => a + s.v, 0) || 1;
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
