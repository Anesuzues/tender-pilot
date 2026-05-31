/* ---------- Dashboard ---------- */
function Dashboard({ onNav, user }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [tenders, setTenders] = React.useState(isLoggedIn ? [] : TENDERS);
  const [stats, setStats] = React.useState(null);
  const [activityData, setActivityData] = React.useState(TENDER_ACTIVITY_MONTH);
  const [loaded, setLoaded] = React.useState(!isLoggedIn);

  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    API.getTenders({ limit: 20 }).then(r => { setTenders(r.items); setLoaded(true); }).catch(() => setLoaded(true));
    API.getAnalytics().then(d => {
      setStats(d.stats);
      if (d.activity_by_month && d.activity_by_month.length) {
        setActivityData(d.activity_by_month.map(m => ({ m: m.month, uploaded: m.uploaded, won: m.won, lost: m.lost })));
      }
    }).catch(() => {});
  }, []);

  const name = (user && (user.full_name || user.email)) || "Lerato";
  const firstName = name.split(" ")[0];
  const activeCount = stats ? stats.active_tenders : tenders.length;
  const avgScore = stats ? stats.avg_match_score : 76;
  const missingDocs = stats ? (stats.vault_completeness < 100 ? Math.max(0, 10 - Math.round(stats.vault_completeness / 10)) : 0) : 3;

  return (
    <div className="page">
      <PageHeader
        eyebrow={"Workspace"}
        title={`Good morning, ${firstName}.`}
        subtitle={`${activeCount} active tenders · ${stats ? stats.closing_soon : 3} closing this week`}
        actions={
          <>
            <button className="btn btn-sm" onClick={() => window.location.reload()}><Icon.refresh size={13}/> Refresh</button>
            <button className="btn btn-sm btn-primary" onClick={() => onNav("upload")}>
              <Icon.plus size={13}/> Upload tender
            </button>
          </>
        }
      />

      <div className="grid g-4">
        <KPI label="Active tenders" value={String(activeCount)} delta="+3" deltaDir="up" spark={[6,7,8,9,9,11,11,12,13,activeCount]}/>
        <KPI label="Bid readiness avg" value={avgScore + "%"} delta="+9 pts" deltaDir="up" spark={[58,60,63,67,68,70,72,74,75,avgScore]}/>
        <KPI label="Missing documents" value={String(missingDocs)} delta="-2" deltaDir="up" spark={[6,6,5,5,5,4,4,4,3,missingDocs]}/>
        <KPI label="Pipeline value" value={"R " + tenders.reduce((s, t) => { const v = parseFloat((t.value || "0").replace(/[^0-9.]/g, "")); return s + (isNaN(v) ? 0 : v); }, 0).toFixed(1) + "M"} delta="+R 18.3M" deltaDir="up" spark={[40,42,48,52,55,62,68,74,82,92]}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 16 }} className="dash-main">
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Tender activity</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Uploaded vs won · last 6 months</div>
            </div>
            <div className="row gap-2">
              <span className="chip"><span className="chip-dot" style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}/>Uploaded</span>
              <span className="chip emerald"><span className="chip-dot"/>Won</span>
            </div>
          </div>
          <MonthBars data={activityData} height={220}/>
        </div>

        <div className="card ai-glow" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
            <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
            <div style={{ fontSize: 13, fontWeight: 600 }}>AI insights</div>
            <span className="chip blue" style={{ marginLeft: "auto" }}>3 new</span>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <Insight tone="emerald" icon="trending" title="Match score climbing"
              body="Your average tender match score is up 9 points this month. SARS and Eskom tenders are your strongest fit."/>
            <Insight tone="amber" icon="clock" title="3 docs expire within 30 days"
              body="B-BBEE affidavit, Bank Confirmation and COID letter need renewal before bidding on upcoming tenders."/>
            <Insight tone="blue" icon="bolt" title="New SARS tender matches at 86%"
              body="RFB 2025/IT/0142 closes in 19 days. You meet 7/10 mandatory requirements." action={{ label: "Open analysis", to: "analysis" }} onNav={onNav}/>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 16 }} className="dash-main">
        <div className="card" style={{ padding: 0 }}>
          <div className="between" style={{ padding: "14px 18px" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Active tenders</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Sorted by closing date</div>
            </div>
            <div className="row gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => onNav("tenders")}>View all<Icon.arrow size={12}/></button>
            </div>
          </div>
          <div className="scrollx">
            <table className="table">
              <thead>
                <tr><th>Tender</th><th>Issuer</th><th>Closes</th><th style={{ textAlign: "right" }}>Value</th><th>Match</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {loaded && tenders.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)", fontSize: 13 }}>
                    No tenders yet — <a style={{ color: "var(--emerald)", cursor: "pointer", fontWeight: 500 }} onClick={() => onNav("upload")}>upload your first tender</a>
                  </td></tr>
                )}
                {tenders.slice(0, 6).map(t => (
                  <tr key={t._apiId || t.id} style={{ cursor: "pointer" }} onClick={() => onNav("analysis", t._apiId ? { tenderId: t._apiId } : {})}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{t.id}</div>
                    </td>
                    <td><div style={{ fontSize: 12.5 }}>{t.issuer}</div><div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{t.type}</div></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                        <span className="mono">{t.closingDays != null ? t.closingDays + "d" : "—"}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{t.deadline}</div>
                    </td>
                    <td style={{ textAlign: "right" }} className="mono tnum">{t.value}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 50, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${t.score}%`, height: "100%", background: t.score >= 80 ? "var(--emerald)" : t.score >= 60 ? "var(--amber)" : "var(--red)" }}/>
                        </div>
                        <span className="mono tnum" style={{ fontSize: 12 }}>{t.score}</span>
                      </div>
                    </td>
                    <td><StatusChip status={t.status}/></td>
                    <td><Icon.chev size={13} style={{ color: "var(--text-3)" }}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col gap-4">
          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Closing soon</div>
              <span className="chip red"><span className="chip-dot"/>urgent</span>
            </div>
            <div className="col gap-3">
              {tenders.filter(t => t.closingDays != null && t.closingDays <= 19).slice(0,3).map(t => (
                <div key={t._apiId || t.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexDirection: "column", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: t.closingDays <= 7 ? "var(--red)" : "var(--amber)" }}>{t.closingDays}</div>
                    <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: -2 }}>days</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.issuer}</div>
                  </div>
                  <span className="mono tnum" style={{ fontSize: 11.5 }}>{t.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Compliance overview</div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav("compliance")}>Open <Icon.arrow size={12}/></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Ring value={stats ? stats.vault_completeness : 82} size={92} label="overall"/>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                <ComplianceRow label="Tax" v={100} status="ok"/>
                <ComplianceRow label="B-BBEE" v={92} status="warn"/>
                <ComplianceRow label="Insurance" v={88} status="warn"/>
                <ComplianceRow label="SBD Forms" v={62} status="bad"/>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Recent activity</div>
            <div className="col gap-3">
              {ACTIVITY.slice(0,5).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: a.who === "AI" ? "var(--emerald-soft)" : "var(--surface-2)", color: a.who === "AI" ? "var(--emerald)" : "var(--text-2)", display: "grid", placeItems: "center" }}>
                    {a.who === "AI" ? <Icon.sparkles size={11}/> : <Icon.user size={11}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}><b style={{ fontWeight: 500 }}>{a.who}</b> <span style={{ color: "var(--text-2)" }}>{a.text}</span></div>
                    <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{a.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 1100px){.dash-main{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

function Insight({ tone, icon, title, body, action, onNav }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: "grid", placeItems: "center" }}>
        {Icon[icon] && Icon[icon]({ size: 14 })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5 }}>{body}</div>
        {action && (
          <button className="btn btn-sm btn-ghost" style={{ padding: 0, marginTop: 8, color: `var(--${tone})` }} onClick={() => onNav(action.to)}>
            {action.label} <Icon.arrow size={11}/>
          </button>
        )}
      </div>
    </div>
  );
}

function ComplianceRow({ label, v, status }) {
  const color = status === "ok" ? "var(--emerald)" : status === "warn" ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
      <div style={{ width: 56, color: "var(--text-2)" }}>{label}</div>
      <div style={{ flex: 1 }}><Bar value={v} color={color}/></div>
      <div className="mono tnum" style={{ width: 32, textAlign: "right", color: "var(--text-2)" }}>{v}%</div>
    </div>
  );
}

Object.assign(window, { Dashboard });
