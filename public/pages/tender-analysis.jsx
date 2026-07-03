/* ---------- Tender Analysis (real data only) ---------- */
function TenderAnalysis({ onNav, tenderId }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [tenderData, setTenderData] = React.useState(null);
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(!!tenderId);
  const [running, setRunning] = React.useState(false);
  const [expanded, setExpanded] = React.useState(new Set(["req"]));
  const [aiPanelTab, setAiPanelTab] = React.useState("insights");

  const load = React.useCallback(async () => {
    if (!tenderId || !isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    const [tRes, aRes] = await Promise.allSettled([
      API.getTender(tenderId),
      API.getAnalysis(tenderId),
    ]);
    if (tRes.status === "fulfilled" && tRes.value) setTenderData(tRes.value);
    if (aRes.status === "fulfilled" && aRes.value) setAnalysis(aRes.value);
    setLoading(false);
  }, [tenderId, isLoggedIn]);

  React.useEffect(() => { load(); }, [load]);

  const runAnalysis = async () => {
    setRunning(true);
    try {
      const a = await API.runAnalysis(tenderId);
      setAnalysis(a);
      const t = await API.getTender(tenderId).catch(() => null);
      if (t) setTenderData(t);
    } catch (e) {
      window.toast && toast("Analysis failed — please retry.");
    } finally {
      setRunning(false);
    }
  };

  const toggle = (k) => { const s = new Set(expanded); s.has(k) ? s.delete(k) : s.add(k); setExpanded(s); };

  // No tender selected
  if (!tenderId) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}><Icon.scan size={24}/></div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Select a tender to analyse</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>Open a tender from your workspace, or discover and import one from the live government feed.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => onNav("tenders")}>My tenders</button>
            <button className="btn" onClick={() => onNav("discover")}><Icon.globe size={13}/> Discover</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", color: "var(--text-3)" }}>
          <span className="spin" style={{ display: "inline-block", width: 22, height: 22, borderRadius: 999, border: "2.5px solid var(--border-strong)", borderTopColor: "var(--emerald)", marginBottom: 12 }}/>
          <div style={{ fontSize: 13 }}>Loading analysis…</div>
        </div>
      </div>
    );
  }

  const t = tenderData || {};
  const reqs = (analysis && analysis.requirements) || [];
  const passCount = reqs.filter(r => r.status === "pass").length;
  const warnCount = reqs.filter(r => r.status === "warn").length;
  const failCount = reqs.filter(r => r.status === "fail").length;
  const evalCriteria = (analysis && analysis.eval_criteria) || [];
  const missing = (analysis && analysis.missing_documents) || [];
  const citations = (analysis && analysis.citations) || [];
  const score = t.score || (analysis && analysis.score) || 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: 0, flex: 1 }} className="ta-grid">
      <div style={{ overflowY: "auto" }}>
        <div className="page" style={{ paddingRight: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.id}</span>
                {t.type && <span className="chip">{t.type}</span>}
                {t.risk && <RiskBadge risk={t.risk}/>}
                {analysis && <span className="chip blue"><Icon.sparkles size={10}/>AI analysed</span>}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.022em", margin: 0, lineHeight: 1.18, maxWidth: 760, textWrap: "balance" }}>{t.title || "Untitled tender"}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14, fontSize: 12.5, color: "var(--text-2)" }}>
                {t.issuer && <span><Icon.building size={12}/> {t.issuer}</span>}
                {t.province && <span><Icon.globe size={12}/> {t.province}</span>}
                {t.publishedDate && <span><Icon.calendar size={12}/> Published {t.publishedDate}</span>}
                {t.pages ? <span><Icon.doc size={12}/> {t.pages} pages</span> : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-sm" onClick={async () => {
                if (!t._apiId) { window.toast && toast("No source PDF for this tender."); return; }
                try { const b = await API.downloadTenderFile(t._apiId); window.downloadBlob(b, (t.title || "tender") + ".pdf"); }
                catch { window.toast && toast("No source PDF available."); }
              }}><Icon.download size={13}/> Original PDF</button>
              <button className="btn btn-sm" onClick={async () => { const ok = await window.copyToClipboard(window.location.href); window.toast && toast(ok ? "Link copied" : "Copy failed"); }}><Icon.copy size={13}/> Share</button>
              <button className="btn btn-sm btn-primary" onClick={() => onNav("builder", t._apiId ? { tenderId: t._apiId } : {})}><Icon.edit size={13}/> Start proposal</button>
            </div>
          </div>

          {/* No analysis yet → prompt to run it */}
          {!analysis ? (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <Icon.sparkles size={26} style={{ color: "var(--emerald)", opacity: .6, marginBottom: 14 }}/>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Run AI analysis</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
                TenderPilot will read this tender, extract mandatory requirements with citations, score your bid readiness, and flag missing documents.
              </div>
              <button className="btn btn-primary" onClick={runAnalysis} disabled={running}>
                {running ? <><span className="spin" style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, border: "2px solid white", borderTopColor: "transparent" }}/> Analysing…</> : <><Icon.scan size={13}/> Analyse tender</>}
              </button>
            </div>
          ) : (
            <>
              {/* Hero metrics — real */}
              <div className="card" style={{ padding: 22, marginBottom: 16, background: "linear-gradient(135deg, var(--surface), color-mix(in oklab, var(--emerald-soft), var(--surface) 70%))" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 30, alignItems: "center" }} className="ta-metrics">
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <Ring value={score} size={110} stroke={9}/>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Bid readiness</div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, letterSpacing: "-0.014em" }}>{score >= 80 ? "Strong match" : score >= 60 ? "Good match" : "Needs attention"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, maxWidth: 260, lineHeight: 1.5 }}>
                        {reqs.length ? `${passCount} of ${reqs.length} requirements met${warnCount ? `, ${warnCount} need attention` : ""}${failCount ? `, ${failCount} unmet` : ""}.` : "Analysis complete."}
                      </div>
                    </div>
                  </div>
                  <div className="vdivider" style={{ height: 70 }}/>
                  <Metric label="Closes in" value={t.closingDays != null ? String(t.closingDays) : "—"} unit={t.closingDays != null ? "days" : ""} sub={t.deadline || ""} tone="amber"/>
                  <Metric label="Recommendation" value={(analysis.recommendation || "review").toUpperCase()} unit="" sub={t.risk ? t.risk + " risk" : ""} tone={analysis.recommendation === "submit" ? "emerald" : "amber"}/>
                </div>
              </div>

              {/* Evaluation criteria — real, only if present */}
              {evalCriteria.length > 0 && (
                <Section title="Evaluation criteria" k="eval" expanded={expanded} toggle={toggle}>
                  <div className="grid g-3">
                    {evalCriteria.map((c, i) => (
                      <div key={c.id || i} className="card card-pad-sm">
                        <div className="between">
                          <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.name}</div>
                          <div className="mono tnum" style={{ fontSize: 11, color: "var(--text-3)" }}>{c.weight} pts</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                          <div className="tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em" }}>{c.score != null ? c.score : "—"}</div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>/ {c.weight}</div>
                        </div>
                        {c.score != null && <div style={{ marginTop: 10 }}><Bar value={(c.score / c.weight) * 100} color={c.score / c.weight >= 0.8 ? "var(--emerald)" : c.score / c.weight >= 0.6 ? "var(--amber)" : "var(--red)"}/></div>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Requirements — real */}
              <Section title="Mandatory requirements"
                       sub={reqs.length ? `${reqs.length} detected · ${passCount} pass · ${warnCount} caution · ${failCount} fail` : "None detected"}
                       k="req" expanded={expanded} toggle={toggle}
                       right={<span className="chip"><Icon.sparkles size={10}/>AI extracted</span>}>
                {reqs.length ? (
                  <div className="col gap-2">{reqs.map((r, i) => <RequirementRow key={r.id || i} r={r}/>)}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "12px 0" }}>No mandatory requirements were extracted from this document.</div>
                )}
              </Section>

              {/* Missing documents — real */}
              <Section title="Missing documents"
                       sub="Compared against your compliance vault"
                       k="docs" expanded={expanded} toggle={toggle}
                       right={missing.length ? <span className="chip red"><span className="chip-dot"/>{missing.length} missing</span> : <span className="chip emerald"><span className="chip-dot"/>all present</span>}>
                {missing.length ? (
                  <div className="grid g-2">
                    {missing.map((cat, i) => (
                      <div key={i} className="card card-pad-sm" style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--red-soft)", color: "var(--red)", display: "grid", placeItems: "center" }}><Icon.alert size={15}/></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cat}</div>
                          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>No {cat} document found in your vault.</div>
                          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                            <button className="btn btn-sm" onClick={() => onNav("vault")}>Upload</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => onNav("chat", t._apiId ? { tenderId: t._apiId } : {})}><Icon.sparkles size={11}/> Ask AI</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "12px 0" }}>Every required document category is present in your vault.</div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>

      {/* AI panel — real */}
      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }} className="ta-aside">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>AI Co-Pilot</div>
        </div>
        <div style={{ display: "flex", padding: "8px 12px 0", gap: 4 }}>
          {[{ id: "insights", label: "Insights" }, { id: "sources", label: "Sources" }].map(tab => (
            <button key={tab.id} onClick={() => setAiPanelTab(tab.id)} className={cx("btn btn-sm", aiPanelTab === tab.id ? "btn-dark" : "btn-ghost")} style={{ flex: 1, justifyContent: "center" }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {aiPanelTab === "insights" && <AIInsights analysis={analysis} tender={t}/>}
          {aiPanelTab === "sources" && <AISources citations={citations}/>}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => onNav("chat", t._apiId ? { tenderId: t._apiId } : {})}>
            <Icon.spark size={12}/> Ask about this tender
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1180px){ .ta-grid{ grid-template-columns:1fr!important; } .ta-aside{ display:none!important; } }
        @media (max-width: 720px){ .ta-metrics{ grid-template-columns:1fr!important; } }
      `}</style>
    </div>
  );
}

function Metric({ label, value, unit, sub, tone }) {
  const color = tone === "emerald" ? "var(--emerald)" : tone === "amber" ? "var(--amber)" : "var(--text)";
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
        <div style={{ fontSize: value && value.length > 6 ? 18 : 28, fontWeight: 600, letterSpacing: "-0.025em", color }} className="tnum">{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{unit}</div>
      </div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, sub, k, expanded, toggle, children, right }) {
  const open = expanded.has(k);
  return (
    <div className="card" style={{ marginBottom: 16, padding: 0 }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: open ? "1px solid var(--border)" : "none" }} onClick={() => toggle(k)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.012em" }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>}
        </div>
        {right}
        <Icon.chevDown size={15} style={{ color: "var(--text-3)", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}/>
      </div>
      {open && <div style={{ padding: 20 }}>{children}</div>}
    </div>
  );
}

function RequirementRow({ r }) {
  const map = {
    pass: { color: "var(--emerald)", bg: "var(--emerald-soft)", icon: <Icon.check size={13}/> },
    warn: { color: "var(--amber)", bg: "var(--amber-soft)", icon: <Icon.alert size={13}/> },
    fail: { color: "var(--red)", bg: "var(--red-soft)", icon: <Icon.x size={13}/> },
  };
  const c = map[r.status] || map.warn;
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 9, background: "var(--surface)" }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: c.bg, color: c.color, display: "grid", placeItems: "center", flexShrink: 0 }}>{c.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {r.section && <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>§{r.section}</span>}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.text}</span>
        </div>
        {r.note && <div style={{ fontSize: 12, color: c.color, marginTop: 6, fontWeight: 500 }}><span style={{ color: "var(--text-3)", fontWeight: 400 }}>AI note · </span>{r.note}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {r.page && <span className="chip"><Icon.doc size={10}/>p. {r.page}</span>}
        <StatusChip status={r.status}/>
      </div>
    </div>
  );
}

function AIInsights({ analysis, tender }) {
  const rationale = analysis && analysis.match && analysis.match.rationale;
  return (
    <div className="col gap-3">
      <div className="card card-pad-sm" style={{ background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon.bolt size={13} style={{ color: "var(--emerald)" }}/>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Summary</div>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text)", textWrap: "pretty" }}>
          {analysis && analysis.summary ? analysis.summary : "No summary generated."}
        </div>
      </div>

      {analysis && (analysis.recommendation || tender.risk) && (
        <div className="card card-pad-sm">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon.flag size={13} style={{ color: "var(--blue)" }}/>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Assessment</div>
          </div>
          <div className="col gap-2" style={{ fontSize: 12 }}>
            {analysis.score != null && <div className="between"><span className="muted">Bid readiness</span><span className="mono tnum">{analysis.score}%</span></div>}
            {analysis.recommendation && <div className="between"><span className="muted">Recommendation</span><span className="mono tnum" style={{ textTransform: "capitalize" }}>{analysis.recommendation}</span></div>}
            {tender.risk && <div className="between"><span className="muted">Risk</span><span className="mono tnum" style={{ textTransform: "capitalize" }}>{tender.risk}</span></div>}
          </div>
        </div>
      )}

      {rationale && Object.keys(rationale).length > 0 && (
        <div className="card card-pad-sm">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon.layers size={13} style={{ color: "var(--violet)" }}/>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Match breakdown</div>
          </div>
          <div className="col gap-2" style={{ fontSize: 12 }}>
            {Object.entries(rationale).map(([k, v]) => (
              <div key={k}>
                <div className="between" style={{ marginBottom: 4 }}><span className="muted" style={{ textTransform: "capitalize" }}>{k}</span><span className="mono tnum">{Math.round(v * 100)}%</span></div>
                <Bar value={v * 100} color={v >= 0.8 ? "var(--emerald)" : v >= 0.5 ? "var(--amber)" : "var(--red)"}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AISources({ citations }) {
  if (!citations || !citations.length) {
    return <div style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", padding: "24px 8px" }}>No source citations for this analysis yet.</div>;
  }
  return (
    <div className="col gap-2">
      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2, fontWeight: 600 }}>Cited from source PDF</div>
      {citations.map((s, i) => (
        <div key={i} className="card card-pad-sm" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 40, borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>p.{s.page || "?"}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{s.snippet || "Source excerpt"}</div>
            {s.section && <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>§ {s.section}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Suggestion({ children, onClick }) {
  return (
    <button onClick={onClick} className="btn btn-sm btn-ghost" style={{ fontSize: 11, padding: "3px 9px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999 }}>{children}</button>
  );
}

Object.assign(window, { TenderAnalysis });
