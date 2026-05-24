/* ---------- Proposal Builder ---------- */
function ProposalBuilder({ onNav }) {
  const [active, setActive] = React.useState("ps2"); // Executive Summary
  const [generating, setGenerating] = React.useState(false);
  const [text, setText] = React.useState(EXEC_SUMMARY);

  const handleRegenerate = () => {
    setGenerating(true);
    setText("");
    let i = 0;
    const tick = () => {
      if (i < EXEC_SUMMARY.length) {
        setText(EXEC_SUMMARY.slice(0, i));
        i += Math.max(4, Math.floor(EXEC_SUMMARY.length / 220));
        setTimeout(tick, 14);
      } else {
        setText(EXEC_SUMMARY);
        setGenerating(false);
      }
    };
    setTimeout(tick, 200);
  };

  const activeSection = PROPOSAL_SECTIONS.find(s => s.id === active) || PROPOSAL_SECTIONS[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", flex: 1, minHeight: 0 }} className="pb-grid">
      {/* Sections sidebar */}
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto", display: "flex", flexDirection: "column" }} className="pb-sidebar">
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Proposal</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>SARS Cybersecurity Bid</div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>RFB 2025/IT/0142</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <Ring value={68} size={36} stroke={4}/>
            <div style={{ fontSize: 11.5, color: "var(--text-2)" }}>68% complete · 5 / 8 sections</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {PROPOSAL_SECTIONS.map((s, i) => (
            <div key={s.id}
                 className={cx("nav-item", active === s.id && "active")}
                 style={{ fontSize: 12.5, margin: 0, padding: "9px 10px", borderRadius: 7 }}
                 onClick={() => setActive(s.id)}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)", width: 18 }}>{String(i+1).padStart(2,"0")}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <StatusDot status={s.status}/>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}><Icon.download size={12}/> Export DOCX / PDF</button>
        </div>
      </aside>

      {/* Editor */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        {/* Toolbar */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elev)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{activeSection.title}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              <span className="mono">{text.split(/\s+/).filter(Boolean).length} words</span> · last edit {activeSection.lastEdit} · <AvatarGroup names={["Lerato M","Sipho N","Thandi K"]} max={3}/>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost"><Icon.refresh size={12}/> Versions</button>
          <button className="btn btn-sm"><Icon.copy size={12}/></button>
          <button className="btn btn-sm btn-primary" onClick={handleRegenerate} disabled={generating}>
            {generating ? <><span className="spin" style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, border: "2px solid white", borderTopColor: "transparent" }}/> Generating…</> :
              <><Icon.sparkles size={12}/> Regenerate</>}
          </button>
        </div>

        {/* Document */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 80px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="card" style={{ padding: "48px 56px", minHeight: 600, position: "relative" }}>
              {generating && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                  <AIBar/>
                </div>
              )}
              <div style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                Section 02 · Executive Summary
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 20 }}>
                Executive Summary
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text)", whiteSpace: "pre-wrap", textWrap: "pretty", minHeight: 400 }}>
                {text}
                {generating && <span className="pulse-dot" style={{ display: "inline-block", width: 8, height: 18, background: "var(--emerald)", marginLeft: 2, verticalAlign: "text-bottom" }}/>}
              </div>
            </div>

            {/* Action buttons under doc */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
              <div className="row gap-2">
                <button className="btn btn-sm btn-ghost"><Icon.sparkles size={11}/> Make more concise</button>
                <button className="btn btn-sm btn-ghost"><Icon.sparkles size={11}/> Add a stat</button>
                <button className="btn btn-sm btn-ghost"><Icon.sparkles size={11}/> Match company tone</button>
              </div>
              <button className="btn btn-sm" onClick={() => setActive(PROPOSAL_SECTIONS[PROPOSAL_SECTIONS.findIndex(s => s.id === active) + 1]?.id || active)}>
                Next: {PROPOSAL_SECTIONS[PROPOSAL_SECTIONS.findIndex(s => s.id === active) + 1]?.title || "—"} <Icon.arrow size={12}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: AI helper */}
      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto" }} className="pb-helper">
        <div style={{ padding: 14 }}>
          <div className="ai-glow" style={{ padding: 14, borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon.sparkles size={13} style={{ color: "var(--emerald)" }}/>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Writing assistant</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
              Drafting your <b>Executive Summary</b> using your company profile, the 3 most-similar past wins, and section 1 of the RFB.
            </div>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 10 }}>Quick actions</div>
          <div className="col gap-2">
            {[
              { icon: "doc", t: "Insert capability statement" },
              { icon: "chart", t: "Insert win-rate stat" },
              { icon: "shield", t: "Insert B-BBEE Level 2 statement" },
              { icon: "edit", t: "Tighten paragraph 2" },
            ].map((a, i) => (
              <button key={i} className="card card-pad-sm" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", textAlign: "left", cursor: "pointer", background: "var(--surface)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: "var(--surface-2)", color: "var(--text-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {Icon[a.icon] && Icon[a.icon]({ size: 12 })}
                </div>
                <div style={{ fontSize: 12, flex: 1 }}>{a.t}</div>
                <Icon.arrow size={11} style={{ color: "var(--text-3)" }}/>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, margin: "22px 0 10px" }}>Version history</div>
          <div className="col gap-2">
            {[
              { v: "v4 (current)", by: "AI", time: "just now", active: true },
              { v: "v3", by: "Lerato M", time: "23 min ago" },
              { v: "v2", by: "AI", time: "1 h ago" },
              { v: "v1", by: "AI", time: "Yesterday" },
            ].map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderRadius: 7, background: h.active ? "var(--surface)" : "transparent", border: h.active ? "1px solid var(--border)" : "1px solid transparent", fontSize: 12, gap: 10 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{h.v}</span>
                <span style={{ flex: 1, color: "var(--text-2)" }}>by {h.by}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1180px){
          .pb-grid{ grid-template-columns:240px 1fr!important; }
          .pb-helper{ display:none!important; }
        }
        @media (max-width: 800px){
          .pb-grid{ grid-template-columns:1fr!important; }
          .pb-sidebar{ display:none!important; }
        }
      `}</style>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    approved: "var(--emerald)",
    "ai-draft": "var(--violet)",
    "in-review": "var(--blue)",
    draft: "var(--text-3)",
    auto: "var(--blue)",
  };
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: map[status] || "var(--text-3)" }}/>;
}

const EXEC_SUMMARY = `Sandile Cybersecurity (Pty) Ltd is pleased to respond to RFB 2025/IT/0142 for the supply, delivery and ongoing maintenance of cybersecurity infrastructure at the South African Revenue Service. We are a Level 2 B-BBEE contributor with seven years of focused experience securing public-sector revenue and financial-services environments — including SARS (2021–2024), SARB, and three provincial treasuries.

Our solution combines next-generation network detection, EDR, and a 24×7 Security Operations Centre located in Centurion, Gauteng, with a hot-standby facility in Cape Town. Both sites are ISO 27001:2022 certified and operate under a SOC 2 Type II audit programme. Engineers on the SARS account will hold valid OEM certifications across Cisco, Palo Alto Networks, and CrowdStrike Falcon (training underway for two staff to satisfy section 3.8 by 30 June 2026).

We have read the evaluation criteria carefully. We meet seven of the ten mandatory requirements as of submission, with the remaining three on a documented remediation plan that closes inside the 30-day evaluation window. Our pricing model holds the per-endpoint fee constant across years 1–5 and includes an 8% transformation discount aligned to your supplier development objectives.

We thank SARS for the opportunity to submit this bid. We commit to the response timelines specified in section 5, and to attending the mandatory briefing on 28 May 2026.`;

Object.assign(window, { ProposalBuilder });
