/* ---------- Dashboard ---------- */
function Dashboard({ onNav, user }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [tenders, setTenders] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [activityData, setActivityData] = React.useState([]);
  const [docs, setDocs] = React.useState([]);
  const [loaded, setLoaded] = React.useState(!isLoggedIn);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    API.getTenders({ limit: 20 }).then(r => { setTenders(r.items || []); setLoaded(true); }).catch(() => setLoaded(true));
    API.getAnalytics().then(d => {
      if (d.stats) setStats(d.stats);
      if (d.activity_by_month) setActivityData(d.activity_by_month.map(m => ({ m: m.month, uploaded: m.uploaded, won: m.won, lost: m.lost })));
    }).catch(() => {});
    API.getDocuments().then(list => setDocs(list || [])).catch(() => {});
  }, []);

  const name = (user && (user.full_name || user.email)) || "there";
  const firstName = name.split(" ")[0];
  const activeCount = stats ? stats.active_tenders : tenders.length;
  const avgScore = stats ? stats.avg_match_score : (tenders.length ? Math.round(tenders.reduce((s, t) => s + (t.score || 0), 0) / tenders.length) : 0);
  const vaultPct = stats ? stats.vault_completeness : 0;
  const closingSoon = stats ? stats.closing_soon : tenders.filter(t => t.closingDays != null && t.closingDays <= 7).length;
  const pipelineValue = tenders.reduce((s, t) => { const v = parseFloat((t.value || "0").replace(/[^0-9.]/g, "")); return s + (isNaN(v) ? 0 : v); }, 0);

  // Real AI insights derived from the user's actual data
  const insights = [];
  const soon = tenders.filter(t => t.closingDays != null && t.closingDays <= 14).sort((a, b) => a.closingDays - b.closingDays);
  if (soon.length) {
    insights.push({ tone: "amber", icon: "clock", title: `${soon.length} tender${soon.length !== 1 ? "s" : ""} closing within 14 days`,
      body: `${soon[0].title} closes in ${soon[0].closingDays} days.`, action: soon[0]._apiId ? { label: "Open analysis", to: "analysis", meta: { tenderId: soon[0]._apiId } } : null });
  }
  const expiring = docs.filter(d => d.status === "expiring" || d.status === "expired");
  if (expiring.length) {
    insights.push({ tone: "red", icon: "alert", title: `${expiring.length} compliance document${expiring.length !== 1 ? "s" : ""} need attention`,
      body: `${expiring.map(d => d.name).slice(0, 3).join(", ")} — renew before bidding.`, action: { label: "Open vault", to: "vault" } });
  }
  const best = [...tenders].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  if (best && best.score >= 70) {
    insights.push({ tone: "emerald", icon: "trending", title: `Strongest match: ${best.score}%`,
      body: `${best.title} is your best-fit open tender.`, action: best._apiId ? { label: "Open analysis", to: "analysis", meta: { tenderId: best._apiId } } : null });
  }

  // Real compliance category coverage from the vault
  const catStatus = (cat) => {
    const found = docs.filter(d => d.category === cat);
    if (!found.length) return { v: 0, status: "bad" };
    if (found.some(d => d.status === "expired")) return { v: 40, status: "bad" };
    if (found.some(d => d.status === "expiring")) return { v: 70, status: "warn" };
    return { v: 100, status: "ok" };
  };
  const complianceRows = [
    { label: "Tax", ...catStatus("Tax") },
    { label: "B-BBEE", ...catStatus("B-BBEE") },
    { label: "Insurance", ...catStatus("Insurance") },
    { label: "SBD Forms", ...catStatus("SBD Forms") },
  ];

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        title={`${greeting}, ${firstName}.`}
        subtitle={loaded ? `${activeCount} active tender${activeCount !== 1 ? "s" : ""}${closingSoon ? ` · ${closingSoon} closing this week` : ""}` : "Loading your workspace…"}
        actions={
          <>
            <button className="btn btn-sm" onClick={() => onNav("discover")}><Icon.globe size={13}/> Discover</button>
            <button className="btn btn-sm btn-primary" onClick={() => onNav("upload")}>
              <Icon.plus size={13}/> Upload tender
            </button>
          </>
        }
      />

      <div className="grid g-4">
        <KPI label="Active tenders" value={String(activeCount)}/>
        <KPI label="Bid readiness avg" value={avgScore ? avgScore + "%" : "—"}/>
        <KPI label="Vault completeness" value={vaultPct ? vaultPct + "%" : "—"}/>
        <KPI label="Pipeline value" value={pipelineValue > 0 ? "R " + pipelineValue.toFixed(1) + "M" : "—"}/>
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
          {activityData.some(m => m.uploaded || m.won) ? (
            <MonthBars data={activityData} height={220}/>
          ) : (
            <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--text-3)", fontSize: 12.5 }}>
              No activity yet — it builds as you upload and win tenders.
            </div>
          )}
        </div>

        <div className="card ai-glow" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
            <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
            <div style={{ fontSize: 13, fontWeight: 600 }}>AI insights</div>
            {insights.length > 0 && <span className="chip blue" style={{ marginLeft: "auto" }}>{insights.length}</span>}
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", padding: "24px 8px", lineHeight: 1.6 }}>
                {loaded ? "Insights appear here once you have active tenders and compliance documents." : "Loading…"}
              </div>
            ) : insights.map((ins, i) => (
              <Insight key={i} tone={ins.tone} icon={ins.icon} title={ins.title} body={ins.body} action={ins.action} onNav={onNav}/>
            ))}
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
                    No tenders yet — <a style={{ color: "var(--emerald)", cursor: "pointer", fontWeight: 500 }} onClick={() => onNav("discover")}>discover live tenders</a> or <a style={{ color: "var(--emerald)", cursor: "pointer", fontWeight: 500 }} onClick={() => onNav("upload")}>upload one</a>.
                  </td></tr>
                )}
                {[...tenders].sort((a, b) => (a.closingDays ?? 999) - (b.closingDays ?? 999)).slice(0, 6).map(t => (
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
                    <td style={{ textAlign: "right" }} className="mono tnum">{t.value || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 50, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${t.score || 0}%`, height: "100%", background: t.score >= 80 ? "var(--emerald)" : t.score >= 60 ? "var(--amber)" : "var(--red)" }}/>
                        </div>
                        <span className="mono tnum" style={{ fontSize: 12 }}>{t.score || 0}</span>
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
              {soon.length > 0 && <span className="chip red"><span className="chip-dot"/>urgent</span>}
            </div>
            <div className="col gap-3">
              {soon.slice(0, 3).map(t => (
                <div key={t._apiId || t.id} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => onNav("analysis", t._apiId ? { tenderId: t._apiId } : {})}>
                  <div style={{ width: 42, height: 42, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexDirection: "column", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: t.closingDays <= 7 ? "var(--red)" : "var(--amber)" }}>{t.closingDays}</div>
                    <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: -2 }}>days</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.issuer}</div>
                  </div>
                  <span className="mono tnum" style={{ fontSize: 11.5 }}>{t.score || 0}%</span>
                </div>
              ))}
              {soon.length === 0 && (
                <div style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>Nothing closing in the next two weeks.</div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Compliance overview</div>
              <button className="btn btn-sm btn-ghost" onClick={() => onNav("compliance")}>Open <Icon.arrow size={12}/></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Ring value={vaultPct} size={92} label="overall"/>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                {complianceRows.map(r => <ComplianceRow key={r.label} label={r.label} v={r.v} status={r.status === "ok" ? "ok" : r.status === "warn" ? "warn" : "bad"}/>)}
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Recent activity</div>
            <div className="col gap-3">
              {loaded && tenders.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>
                  No activity yet — upload or import a tender to get started.
                </div>
              ) : [...tenders].sort((a, b) => (a.closingDays ?? 999) - (b.closingDays ?? 999)).slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center" }}>
                    <Icon.sparkles size={11}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                      <span style={{ color: "var(--text-2)" }}>Tracking</span> <b style={{ fontWeight: 500 }}>{t.title}</b>
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{t.issuer || (t.deadline ? "Closes " + t.deadline : "No deadline set")}</div>
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
          <button className="btn btn-sm btn-ghost" style={{ padding: 0, marginTop: 8, color: `var(--${tone})` }} onClick={() => onNav(action.to, action.meta || {})}>
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
