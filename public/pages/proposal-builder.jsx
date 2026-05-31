/* ---------- Proposal Builder ---------- */
function ProposalBuilder({ onNav, activeTenderId }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [draft, setDraft] = React.useState(null);
  const [activeId, setActiveId] = React.useState(null);
  const [generating, setGenerating] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [loading, setLoading] = React.useState(isLoggedIn && !!activeTenderId);
  const [error, setError] = React.useState(null);
  const [noTender, setNoTender] = React.useState(false);

  // Create or load a proposal draft for the active tender
  React.useEffect(() => {
    if (!isLoggedIn) return;
    if (!activeTenderId) { setNoTender(true); setLoading(false); return; }
    setLoading(true);
    const init = async () => {
      try {
        // Reuse an existing draft for this tender if present
        const existing = await API.getProposals().catch(() => []);
        let d = (existing || []).find(p => p.tender_id === activeTenderId);
        if (!d) d = await API.createProposal(activeTenderId);
        else d = await API.getProposal(d.id);
        setDraft(d);
        if (d.sections && d.sections.length) setActiveId(d.sections[0].id);
      } catch (e) {
        setError(e.message || "Could not load proposal.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [activeTenderId, isLoggedIn]);

  const activeSection = draft && draft.sections ? (draft.sections.find(s => s.id === activeId) || draft.sections[0]) : null;

  const generate = async (section) => {
    if (!draft || !section) return;
    setGenerating(true); setError(null);
    try {
      const updated = await API.generateSection(draft.id, section.kind);
      setDraft(d => ({ ...d, sections: d.sections.map(s => s.id === updated.id ? updated : s) }));
      setActiveId(updated.id);
    } catch (e) {
      setError(e.message || "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const editContent = (val) => {
    setDraft(d => ({ ...d, sections: d.sections.map(s => s.id === activeId ? { ...s, content: val } : s) }));
  };

  const saveEdit = async () => {
    if (!draft || !activeSection) return;
    try {
      await API.updateSection(draft.id, activeSection.id, { content: activeSection.content });
    } catch {}
  };

  const doExport = async (format) => {
    if (!draft) return;
    setExporting(true);
    try {
      const blob = await API.exportProposal(draft.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${draft.id.slice(0, 8)}.${format === "markdown" ? "md" : format === "html" ? "html" : "txt"}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  // --- Not logged in: demo preview ---
  if (!isLoggedIn) {
    return <ProposalBuilderDemo onNav={onNav}/>;
  }

  // --- No tender selected ---
  if (noTender) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
            <Icon.edit size={24}/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Start a proposal</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>
            Open a tender from your workspace and click <b>Start proposal</b> — the builder will create AI-drafted sections from that tender and your company profile.
          </div>
          <button className="btn btn-primary" onClick={() => onNav("tenders")}><Icon.arrow size={13}/> Go to my tenders</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", color: "var(--text-3)" }}>
          <span className="spin" style={{ display: "inline-block", width: 22, height: 22, borderRadius: 999, border: "2.5px solid var(--border-strong)", borderTopColor: "var(--emerald)", marginBottom: 12 }}/>
          <div style={{ fontSize: 13 }}>Preparing your proposal…</div>
        </div>
      </div>
    );
  }

  const sections = (draft && draft.sections) || [];
  const completed = sections.filter(s => s.content).length;
  const pct = sections.length ? Math.round((completed / sections.length) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", flex: 1, minHeight: 0 }} className="pb-grid">
      {/* Sections sidebar */}
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto", display: "flex", flexDirection: "column" }} className="pb-sidebar">
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Proposal</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{draft ? draft.title : "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <Ring value={pct} size={36} stroke={4}/>
            <div style={{ fontSize: 11.5, color: "var(--text-2)" }}>{pct}% complete · {completed}/{sections.length} sections</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {sections.map((s, i) => (
            <div key={s.id}
                 className={cx("nav-item", activeId === s.id && "active")}
                 style={{ fontSize: 12.5, margin: 0, padding: "9px 10px", borderRadius: 7 }}
                 onClick={() => setActiveId(s.id)}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)", width: 18 }}>{String(i+1).padStart(2,"0")}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: s.content ? "var(--emerald)" : "var(--text-3)" }}/>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }} disabled={exporting || !completed} onClick={() => doExport("markdown")}>
            <Icon.download size={12}/> {exporting ? "Exporting…" : "Export (Markdown)"}
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }} disabled={exporting || !completed} onClick={() => doExport("html")}>HTML</button>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }} disabled={exporting || !completed} onClick={() => doExport("text")}>Text</button>
          </div>
        </div>
      </aside>

      {/* Editor */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elev)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{activeSection ? activeSection.title : "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              <span className="mono">{activeSection && activeSection.content ? activeSection.content.split(/\s+/).filter(Boolean).length : 0} words</span>
              {activeSection && activeSection.content ? " · saved draft" : " · not yet generated"}
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => generate(activeSection)} disabled={generating || !activeSection}>
            {generating ? <><span className="spin" style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, border: "2px solid white", borderTopColor: "transparent" }}/> Generating…</> :
              <><Icon.sparkles size={12}/> {activeSection && activeSection.content ? "Regenerate" : "Generate with AI"}</>}
          </button>
        </div>

        {error && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>{error}</div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="card" style={{ padding: "40px 48px", minHeight: 500 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
                {activeSection ? activeSection.title : ""}
              </div>
              {activeSection && activeSection.content ? (
                <textarea
                  value={activeSection.content}
                  onChange={e => editContent(e.target.value)}
                  onBlur={saveEdit}
                  style={{ width: "100%", minHeight: 420, border: 0, outline: "none", background: "transparent", fontSize: 14, lineHeight: 1.75, color: "var(--text)", resize: "vertical", fontFamily: "inherit" }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, textAlign: "center", color: "var(--text-3)" }}>
                  <Icon.sparkles size={26} style={{ color: "var(--emerald)", opacity: .6, marginBottom: 14 }}/>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>This section is empty</div>
                  <div style={{ fontSize: 12.5, maxWidth: 340, lineHeight: 1.55, marginBottom: 18 }}>
                    Click <b>Generate with AI</b> to draft this section using the tender requirements and your company profile.
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => generate(activeSection)} disabled={generating}>
                    <Icon.sparkles size={12}/> Generate with AI
                  </button>
                </div>
              )}
            </div>
            {activeSection && activeSection.content && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn btn-sm" onClick={() => {
                  const idx = sections.findIndex(s => s.id === activeId);
                  if (sections[idx + 1]) setActiveId(sections[idx + 1].id);
                }}>
                  Next: {sections[sections.findIndex(s => s.id === activeId) + 1]?.title || "—"} <Icon.arrow size={12}/>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px){
          .pb-grid{ grid-template-columns:1fr!important; }
          .pb-sidebar{ display:none!important; }
        }
      `}</style>
    </div>
  );
}

/* Demo preview shown when not logged in */
function ProposalBuilderDemo({ onNav }) {
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <Icon.edit size={24}/>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>AI Proposal Builder</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>
          Sign in, upload a tender, and TenderPilot drafts a full proposal — cover letter, executive summary, methodology, compliance matrix and more — grounded in the tender and your company profile.
        </div>
        <button className="btn btn-primary" onClick={() => onNav("auth")}>Sign in to start</button>
      </div>
    </div>
  );
}

Object.assign(window, { ProposalBuilder, ProposalBuilderDemo });
