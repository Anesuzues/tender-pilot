/* ---------- Tender Analysis (showcase page) ---------- */
function TenderAnalysis({ onNav }) {
  const t = TENDERS[0]; // SARS Cybersecurity
  const [expanded, setExpanded] = React.useState(new Set(["req"]));
  const [aiPanelTab, setAiPanelTab] = React.useState("insights");

  const toggle = (k) => {
    const s = new Set(expanded);
    s.has(k) ? s.delete(k) : s.add(k);
    setExpanded(s);
  };

  const totalScore = EVAL_CRITERIA.reduce((a, c) => a + c.score, 0);
  const totalWeight = EVAL_CRITERIA.reduce((a, c) => a + c.weight, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: 0, flex: 1 }} className="ta-grid">
      {/* Main column */}
      <div style={{ overflowY: "auto" }}>
        <div className="page" style={{ paddingRight: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.id}</span>
                <span className="chip">{t.type}</span>
                <RiskBadge risk={t.risk}/>
                <span className="chip blue"><Icon.sparkles size={10}/>AI parsed · 12s</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.022em", margin: 0, lineHeight: 1.18, maxWidth: 760, textWrap: "balance" }}>
                {t.title}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14, fontSize: 12.5, color: "var(--text-2)" }}>
                <span><Icon.building size={12}/> {t.issuer}</span>
                <span><Icon.globe size={12}/> {t.province}</span>
                <span><Icon.calendar size={12}/> Published {t.publishedDate}</span>
                <span><Icon.doc size={12}/> {t.pages} pages · {t.documents} appendices</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-sm"><Icon.download size={13}/> Original PDF</button>
              <button className="btn btn-sm"><Icon.copy size={13}/> Share</button>
              <button className="btn btn-sm btn-primary" onClick={() => onNav("builder")}>
                <Icon.edit size={13}/> Start proposal
              </button>
            </div>
          </div>

          {/* Hero metrics */}
          <div className="card" style={{ padding: 22, marginBottom: 16, background: "linear-gradient(135deg, var(--surface), color-mix(in oklab, var(--emerald-soft), var(--surface) 70%))" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 30, alignItems: "center" }} className="ta-metrics">
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Ring value={t.score} size={110} stroke={9}/>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Bid readiness</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, letterSpacing: "-0.014em" }}>Strong match</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, maxWidth: 240 }}>
                    7 of 10 mandatory requirements met. 2 require attention.
                  </div>
                </div>
              </div>
              <div className="vdivider" style={{ height: 70 }}/>
              <Metric label="Closes in" value={`${t.closingDays}`} unit="days" sub={t.deadline} tone="amber"/>
              <Metric label="Contract value" value="R 24.5" unit="M" sub="5-year term"/>
              <Metric label="Win probability" value="62" unit="%" sub="vs 28% peer avg" tone="emerald"/>
            </div>
          </div>

          {/* Evaluation criteria */}
          <Section title="Evaluation criteria" sub="PPPFA 90/10 split · functionality threshold 70 points" k="eval" expanded={expanded} toggle={toggle}>
            <div className="grid g-3" style={{ marginBottom: 18 }}>
              {EVAL_CRITERIA.map((c, i) => (
                <div key={i} className="card card-pad-sm">
                  <div className="between">
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.name}</div>
                    <div className="mono tnum" style={{ fontSize: 11, color: "var(--text-3)" }}>{c.weight} pts</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                    <div className="tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em" }}>{c.score}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>/ {c.weight}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Bar value={(c.score / c.weight) * 100} color={c.score / c.weight >= 0.8 ? "var(--emerald)" : c.score / c.weight >= 0.6 ? "var(--amber)" : "var(--red)"}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="card card-pad-sm" style={{ background: "var(--surface-2)", borderStyle: "dashed" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <Icon.info size={13} style={{ color: "var(--blue)" }}/>
                <span>You are projected to score <b className="mono">{totalScore}/{totalWeight}</b>. The functionality threshold of <b className="mono">70</b> is met — your bid will be evaluated on price.</span>
              </div>
            </div>
          </Section>

          {/* Requirements checklist */}
          <Section title="Mandatory requirements" sub="10 requirements detected · 7 pass · 2 caution · 1 fail" k="req" expanded={expanded} toggle={toggle}
                   right={<span className="chip"><Icon.sparkles size={10}/>AI extracted with citations</span>}>
            <div className="col gap-2">
              {TENDER_REQUIREMENTS.map((r, i) => (
                <RequirementRow key={r.id} r={r} index={i}/>
              ))}
            </div>
          </Section>

          {/* Missing docs */}
          <Section title="Missing documents" sub="Generated by cross-referencing your vault against tender section 4" k="docs" expanded={expanded} toggle={toggle}
                   right={<span className="chip red"><span className="chip-dot"/>3 missing</span>}>
            <div className="grid g-2">
              {[
                { name: "SBD 4 · Declaration of Interest", note: "Not in vault. AI can auto-draft from your CIPC profile.", severity: "high", action: "Generate" },
                { name: "Reference letter · SARS-equivalent (2 more)", note: "Only 1 of 3 reference letters provided. Reach out to NTSA Kenya and ZRA?", severity: "high", action: "Request" },
                { name: "CrowdStrike Falcon certification (2 staff)", note: "Section 3.8 requires ≥2 certified engineers. Currently 0 in HR vault.", severity: "medium", action: "Upload" },
              ].map((d, i) => (
                <div key={i} className="card card-pad-sm" style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: d.severity === "high" ? "var(--red-soft)" : "var(--amber-soft)",
                    color: d.severity === "high" ? "var(--red)" : "var(--amber)",
                    display: "grid", placeItems: "center"
                  }}>
                    <Icon.alert size={15}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{d.note}</div>
                    <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                      <button className="btn btn-sm">{d.action}</button>
                      <button className="btn btn-sm btn-ghost"><Icon.sparkles size={11}/> Ask AI</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Heat map */}
          <Section title="Compliance coverage heatmap" sub="Your readiness across requirement clusters" k="heat" expanded={expanded} toggle={toggle}>
            <Heatmap
              rows={["Legal", "Financial", "Technical", "HR & Skills", "Operational"]}
              cols={["Mandatory","Technical","Functional","Pricing","Preference"]}
              getValue={(r, c) => {
                const grid = [
                  [.95,.85,.9,.7,.85],
                  [.9,.7,.6,.85,.75],
                  [.8,.5,.55,.6,.8],
                  [.7,.4,.45,.7,.8],
                  [.85,.7,.8,.75,.85],
                ];
                return grid[r][c];
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 18, fontSize: 11, color: "var(--text-3)" }}>
              <span>Coverage scale:</span>
              {[0.2,0.4,0.6,0.8,1].map(v => (
                <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 14, height: 10, borderRadius: 3, background: `rgba(4,120,87,${0.12 + v*0.65})`, border: "1px solid rgba(4,120,87,.18)" }}/>
                  {Math.round(v*100)}%
                </span>
              ))}
            </div>
          </Section>

          {/* Submission instructions */}
          <Section title="Submission instructions" sub="Verbatim from page 27 · cross-checked against National Treasury guidelines" k="sub" expanded={expanded} toggle={toggle}>
            <div className="card card-pad-sm" style={{ background: "var(--surface-2)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                <b>1.</b> Submit by hand or courier to The Procurement Officer, SARS Head Office, 299 Bronkhorst Street, Nieuw Muckleneuk, Pretoria 0181.<br/>
                <b>2.</b> Three (3) original sets and one (1) USB containing PDF copies of all documents.<br/>
                <b>3.</b> Sealed in plain envelopes marked with the tender reference and "DO NOT OPEN BEFORE 12:00 ON 12 JUNE 2026".<br/>
                <b>4.</b> No emailed or faxed submissions will be considered.<br/>
                <b>5.</b> A mandatory briefing session will be held on 28 May 2026 at 10:00.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm"><Icon.calendar size={12}/> Add briefing to calendar</button>
              <button className="btn btn-sm btn-ghost"><Icon.copy size={12}/> Copy address</button>
            </div>
          </Section>
        </div>
      </div>

      {/* AI insights side panel */}
      <aside style={{
        borderLeft: "1px solid var(--border)", background: "var(--bg-elev)",
        overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0
      }} className="ta-aside">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>AI Co-Pilot</div>
          <span className="chip emerald" style={{ marginLeft: "auto", fontSize: 10 }}><span className="chip-dot pulse-dot"/>analyzing</span>
        </div>

        <div style={{ display: "flex", padding: "8px 12px 0", gap: 4 }}>
          {[
            { id: "insights", label: "Insights" },
            { id: "recs", label: "Recommendations" },
            { id: "sources", label: "Sources" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAiPanelTab(tab.id)}
                    className={cx("btn btn-sm", aiPanelTab === tab.id ? "btn-dark" : "btn-ghost")}
                    style={{ flex: 1, justifyContent: "center" }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {aiPanelTab === "insights" && <AIInsights/>}
          {aiPanelTab === "recs" && <AIRecs onNav={onNav}/>}
          {aiPanelTab === "sources" && <AISources/>}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ position: "relative" }}>
            <input className="input" placeholder="Ask anything about this tender…" style={{ paddingRight: 80 }} onClick={() => onNav("chat")}/>
            <button className="btn btn-sm btn-primary" style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }} onClick={() => onNav("chat")}>
              <Icon.send size={12}/>
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Suggestion onClick={() => onNav("chat")}>Summarize pricing</Suggestion>
            <Suggestion onClick={() => onNav("chat")}>Draft cover letter</Suggestion>
            <Suggestion onClick={() => onNav("chat")}>Compare to RFB 099</Suggestion>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1180px){
          .ta-grid{ grid-template-columns:1fr!important; }
          .ta-aside{ display:none!important; }
        }
        @media (max-width: 720px){
          .ta-metrics{ grid-template-columns:1fr!important; }
        }
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
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", color }} className="tnum">{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{unit}</div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Section({ title, sub, k, expanded, toggle, children, right }) {
  const open = expanded.has(k);
  return (
    <div className="card" style={{ marginBottom: 16, padding: 0 }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: open ? "1px solid var(--border)" : "none" }}
           onClick={() => toggle(k)}>
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
  const c = map[r.status];
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 9, background: "var(--surface)" }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: c.bg, color: c.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {c.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>§{r.section}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.text}</span>
        </div>
        {r.note && (
          <div style={{ fontSize: 12, color: c.color, marginTop: 6, paddingLeft: 0, fontWeight: 500 }}>
            <span style={{ color: "var(--text-3)", fontWeight: 400 }}>AI note · </span>{r.note}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span className="chip"><Icon.doc size={10}/>p. {r.page}</span>
        <StatusChip status={r.status}/>
      </div>
    </div>
  );
}

function AIInsights() {
  return (
    <div className="col gap-3">
      <div className="card card-pad-sm" style={{ background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon.bolt size={13} style={{ color: "var(--emerald)" }}/>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Strategic recommendation</div>
          <span className="chip emerald" style={{ marginLeft: "auto", fontSize: 10 }}>92% conf.</span>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text)", textWrap: "pretty" }}>
          Submit — your <b>technical fit is strong</b> (86% match). Prioritise closing the reference and CrowdStrike gaps in the next 7 days. Price aggressively in the 90/10 split: peer median is <b className="mono">R 22.8M</b>.
        </div>
      </div>

      <div className="card card-pad-sm">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon.cpu size={13} style={{ color: "var(--blue)" }}/>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Pricing intelligence</div>
        </div>
        <div className="col gap-2" style={{ fontSize: 12 }}>
          <div className="between"><span className="muted">Estimated peer floor</span><span className="mono tnum">R 19.8M</span></div>
          <div className="between"><span className="muted">Peer median</span><span className="mono tnum">R 22.8M</span></div>
          <div className="between"><span className="muted">Tender ceiling (est.)</span><span className="mono tnum">R 28.0M</span></div>
          <div className="between"><span style={{ color: "var(--emerald)" }}>Recommended pricing</span><span className="mono tnum" style={{ color: "var(--emerald)" }}>R 21.4M</span></div>
        </div>
      </div>

      <div className="card card-pad-sm">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon.flag size={13} style={{ color: "var(--red)" }}/>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Risk warnings</div>
        </div>
        <div className="col gap-2">
          <RiskItem t="Bid bond not mentioned but typical for SARS — confirm before submission" sev="low"/>
          <RiskItem t="Mandatory briefing on 28 May — non-attendance = disqualification" sev="high"/>
          <RiskItem t="Penalty clauses on SLA breach are unusually high (8% of monthly fee)" sev="med"/>
        </div>
      </div>

      <div className="card card-pad-sm">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon.layers size={13} style={{ color: "var(--violet)" }}/>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Similar past tenders</div>
        </div>
        <div className="col gap-2">
          {[
            { id: "SARS/IT/2024/088", title: "Endpoint protection refresh", won: true, score: 89 },
            { id: "SARB/IT/2024/041", title: "SOC modernisation Phase 1", won: false, score: 71 },
            { id: "SARS/IT/2023/119", title: "Threat intel platform", won: true, score: 84 },
          ].map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--border)", gap: 8, fontSize: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{p.id}</div>
              </div>
              <span className="chip" style={{ fontSize: 10 }}>{p.score}%</span>
              <span className={cx("chip", p.won ? "emerald" : "red")} style={{ fontSize: 10 }}>{p.won ? "Won" : "Lost"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskItem({ t, sev }) {
  const map = { high: "var(--red)", med: "var(--amber)", low: "var(--text-3)" };
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
      <span style={{ width: 4, borderRadius: 4, background: map[sev], flexShrink: 0 }}/>
      <span style={{ color: "var(--text-2)" }}>{t}</span>
    </div>
  );
}

function AIRecs({ onNav }) {
  return (
    <div className="col gap-3">
      {[
        { icon: "edit", title: "Draft executive summary", body: "1-page bid summary highlighting your SOC operations and 6 government references.", to: "builder" },
        { icon: "shield", title: "Generate SBD 4 form", body: "Auto-fill from your CIPC profile and director list.", to: "compliance" },
        { icon: "doc", title: "Request 2 reference letters", body: "Draft outreach emails to NTSA Kenya and Zambia Revenue Authority.", to: "chat" },
        { icon: "chart", title: "Build pricing schedule", body: "Pre-fill Annexure C with your standard rate card plus 8% government discount.", to: "builder" },
      ].map((r, i) => (
        <div key={i} className="card card-pad-sm" style={{ display: "flex", gap: 10, cursor: "pointer" }} onClick={() => onNav(r.to)}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            {Icon[r.icon] && Icon[r.icon]({ size: 14 })}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.title}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5 }}>{r.body}</div>
          </div>
          <Icon.arrow size={13} style={{ color: "var(--text-3)", alignSelf: "center" }}/>
        </div>
      ))}
    </div>
  );
}

function AISources() {
  return (
    <div className="col gap-2">
      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2, fontWeight: 600 }}>Cited from source PDF</div>
      {[
        { p: 14, sec: "3.1–3.3", t: "Bidder eligibility & mandatory registration" },
        { p: 18, sec: "3.7", t: "Reference requirements (3 minimum)" },
        { p: 19, sec: "3.8", t: "Personnel certification matrix" },
        { p: 22, sec: "4.0", t: "Document submission list" },
        { p: 27, sec: "5.0", t: "Submission instructions" },
        { p: 31, sec: "6.0", t: "Evaluation criteria & weighting" },
      ].map((s, i) => (
        <div key={i} className="card card-pad-sm" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 32, height: 40, borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>p.{s.p}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{s.t}</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>§ {s.sec}</div>
          </div>
          <Icon.external size={12} style={{ color: "var(--text-3)" }}/>
        </div>
      ))}
    </div>
  );
}

function Suggestion({ children, onClick }) {
  return (
    <button onClick={onClick} className="btn btn-sm btn-ghost" style={{
      fontSize: 11, padding: "3px 9px", background: "var(--surface)",
      border: "1px solid var(--border)", borderRadius: 999,
    }}>{children}</button>
  );
}

Object.assign(window, { TenderAnalysis });
