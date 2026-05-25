/* ---------- Tenders List ---------- */
function TendersList({ onNav }) {
  const [view, setView] = React.useState("table");
  const [filter, setFilter] = React.useState("all");
  const [allTenders, setAllTenders] = React.useState(TENDERS);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    setLoading(true);
    API.getTenders({ limit: 50 }).then(r => { if (r.items.length) setAllTenders(r.items); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filters = ["all", "in-review", "draft", "shortlisted", "flagged"];
  const tenders = allTenders.filter(t => filter === "all" || t.status === filter);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        title="Tenders"
        subtitle={`${allTenders.length} active opportunities`}
        actions={
          <>
            <button className="btn btn-sm"><Icon.filter size={13}/> Filter</button>
            <button className="btn btn-sm btn-primary" onClick={() => onNav("upload")}>
              <Icon.plus size={13}/> Upload tender
            </button>
          </>
        }
      />

      <div className="card" style={{ padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cx("btn btn-sm", filter === f ? "btn-dark" : "btn-ghost")}>
            {f === "all" ? "All tenders" : f.replace("-", " ")}
            <span className="mono" style={{ opacity: .6, marginLeft: 4 }}>
              {f === "all" ? allTenders.length : allTenders.filter(t => t.status === f).length}
            </span>
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        {loading && <span style={{ fontSize: 11, color: "var(--text-3)" }}>Loading…</span>}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <button onClick={() => setView("table")} className={cx("btn btn-sm btn-ghost")} style={{ borderRadius: 0, background: view === "table" ? "var(--surface-2)" : "transparent" }}><Icon.grid size={13}/></button>
          <button onClick={() => setView("cards")} className={cx("btn btn-sm btn-ghost")} style={{ borderRadius: 0, background: view === "cards" ? "var(--surface-2)" : "transparent" }}><Icon.layers size={13}/></button>
        </div>
      </div>

      {view === "table" ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="scrollx">
            <table className="table">
              <thead>
                <tr><th>Tender</th><th>Issuer</th><th>Closes</th><th style={{ textAlign: "right" }}>Value</th><th>B-BBEE</th><th>Risk</th><th>Match</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {tenders.map(t => (
                  <tr key={t._apiId || t.id} onClick={() => onNav("analysis", t._apiId ? { tenderId: t._apiId } : {})} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, maxWidth: 320 }}>{t.title}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{t.id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5 }}>{t.issuer}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{t.type}</div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 12.5 }}>{t.closingDays != null ? t.closingDays + "d" : "—"}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{t.deadline}</div>
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>{t.value}</td>
                    <td><span className="chip" style={{ fontSize: 11 }}>{t.bbbeeRequired || "—"}</span></td>
                    <td><RiskBadge risk={t.risk}/></td>
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
      ) : (
        <div className="grid g-2">
          {tenders.map(t => (
            <div key={t._apiId || t.id} className="card card-pad" style={{ cursor: "pointer" }} onClick={() => onNav("analysis", t._apiId ? { tenderId: t._apiId } : {})}>
              <div className="between" style={{ marginBottom: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{t.id}</span>
                <RiskBadge risk={t.risk}/>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.012em", lineHeight: 1.4 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8 }}>{t.issuer} · {t.type}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {(t.tags || []).map((tag, i) => <span key={i} className="chip" style={{ fontSize: 10.5 }}>{tag}</span>)}
              </div>
              <div className="divider" style={{ margin: "16px 0" }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Value</div>
                  <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{t.value}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Closes</div>
                  <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{t.closingDays != null ? t.closingDays + "d" : "—"}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Ring value={t.score} size={48} stroke={5}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TendersList });
