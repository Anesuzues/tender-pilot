/* ---------- Compliance Checklist ---------- */
function CompliancePage({ onNav }) {
  const groups = [
    {
      id: "g1", title: "Statutory & Registration", weight: 30,
      items: [
        { t: "CSD registration active and current", status: "pass", sev: "critical" },
        { t: "CIPC company disclosure (CoR 14.3) on file", status: "pass", sev: "critical" },
        { t: "All directors listed in disclosure have valid tax PINs", status: "pass", sev: "critical" },
        { t: "Letter of Good Standing (COID) valid", status: "warn", sev: "high", note: "Expires 18 June 2026 — renew before SARS briefing" },
      ],
    },
    {
      id: "g2", title: "Tax & Financial", weight: 25,
      items: [
        { t: "Tax Compliance Status PIN issued within last 12 months", status: "pass", sev: "critical" },
        { t: "UIF compliance letter on file", status: "pass", sev: "medium" },
        { t: "Audited annual financial statements (last 3 years)", status: "pass", sev: "high" },
        { t: "Bank confirmation letter dated within last 30 days", status: "fail", sev: "critical", note: "Last letter dated 30 Oct 2025 — expired. Request fresh letter from FNB." },
      ],
    },
    {
      id: "g3", title: "Transformation (B-BBEE)", weight: 20,
      items: [
        { t: "B-BBEE Verification Certificate or sworn affidavit valid", status: "warn", sev: "high", note: "Affidavit expires 8 June 2026 — schedule renewal." },
        { t: "Affidavit signed by Commissioner of Oaths", status: "pass", sev: "high" },
        { t: "Preferential procurement: Yellow EME / QSE", status: "pass", sev: "medium" },
      ],
    },
    {
      id: "g4", title: "Insurance & Risk", weight: 15,
      items: [
        { t: "Public liability insurance (R 10M minimum)", status: "pass", sev: "critical" },
        { t: "Professional indemnity insurance", status: "pass", sev: "high" },
        { t: "Cyber liability insurance", status: "warn", sev: "medium", note: "Coverage is R 5M; SARS typically requires R 10M." },
      ],
    },
    {
      id: "g5", title: "SBD Forms", weight: 10,
      items: [
        { t: "SBD 4 — Declaration of Interest", status: "fail", sev: "critical", note: "Form not uploaded. AI can auto-draft from CIPC profile." },
        { t: "SBD 6.1 — Preference Points Claim", status: "pass", sev: "critical" },
        { t: "SBD 8 — Declaration of Bidder's Past Practice", status: "pass", sev: "high" },
        { t: "SBD 9 — Certificate of Independent Bid Determination", status: "pass", sev: "high" },
      ],
    },
  ];

  const allItems = groups.flatMap(g => g.items);
  const pass = allItems.filter(i => i.status === "pass").length;
  const warn = allItems.filter(i => i.status === "warn").length;
  const fail = allItems.filter(i => i.status === "fail").length;
  const overall = Math.round((pass / allItems.length) * 100);

  const [openGroups, setOpenGroups] = React.useState(new Set(groups.map(g => g.id)));
  const toggle = (id) => {
    const s = new Set(openGroups);
    s.has(id) ? s.delete(id) : s.add(id);
    setOpenGroups(s);
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 16, padding: "10px 16px", background: "var(--amber-soft)", border: "1px solid var(--amber)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
        <Icon.alert size={14} style={{ color: "var(--amber)", flexShrink: 0 }}/>
        <span><b>Beta feature</b> — Compliance data below is sample content showing what this page will look like once connected to your Document Vault. Upload your compliance documents to get your real score.</span>
      </div>
      <PageHeader
        eyebrow="Compliance"
        title="Compliance Checklist"
        subtitle="Live readiness assessment across statutory, tax, transformation, insurance and SBD requirements."
        actions={
          <>
            <button className="btn btn-sm"><Icon.download size={13}/> Export checklist</button>
            <button className="btn btn-sm btn-primary"><Icon.sparkles size={13}/> Fix all with AI</button>
          </>
        }
      />

      {/* Hero readiness */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 30, alignItems: "center" }} className="ta-metrics">
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Ring value={overall} size={108}/>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Compliance score</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>Needs attention</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, maxWidth: 280 }}>
                2 critical fails block submission on tier-1 tenders. 3 warnings are time-sensitive.
              </div>
            </div>
          </div>
          <div className="vdivider" style={{ height: 70 }}/>
          <Metric label="Compliant" value={String(pass)} unit={`/ ${allItems.length}`} sub="items pass" tone="emerald"/>
          <Metric label="Warnings" value={String(warn)} unit="items" sub="time-sensitive" tone="amber"/>
          <Metric label="Critical fails" value={String(fail)} unit="items" sub="must remediate" tone={fail > 0 ? "" : "emerald"}/>
        </div>
      </div>

      {/* Checklist groups */}
      <div className="col gap-3">
        {groups.map(g => {
          const open = openGroups.has(g.id);
          const groupPass = g.items.filter(i => i.status === "pass").length;
          const pct = Math.round((groupPass / g.items.length) * 100);
          return (
            <div key={g.id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                   onClick={() => toggle(g.id)}>
                <Ring value={pct} size={42} stroke={4}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
                    {groupPass} of {g.items.length} items pass · weight {g.weight}%
                  </div>
                </div>
                <span className="chip">{pct}%</span>
                <Icon.chevDown size={14} style={{ color: "var(--text-3)", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}/>
              </div>
              {open && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {g.items.map((it, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 20px", borderTop: i ? "1px solid var(--border)" : "none"
                    }}>
                      <StatusIconBox status={it.status}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</div>
                        {it.note && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{it.note}</div>}
                      </div>
                      <SeverityChip sev={it.sev}/>
                      <StatusChip status={it.status}/>
                      {it.status !== "pass" && (
                        <button className="btn btn-sm">{it.status === "fail" ? "Fix" : "Renew"}</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusIconBox({ status }) {
  const map = {
    pass: { bg: "var(--emerald-soft)", c: "var(--emerald)", i: <Icon.check size={13}/> },
    warn: { bg: "var(--amber-soft)", c: "var(--amber)", i: <Icon.alert size={13}/> },
    fail: { bg: "var(--red-soft)", c: "var(--red)", i: <Icon.x size={13}/> },
  };
  const m = map[status];
  return (
    <div style={{ width: 26, height: 26, borderRadius: 7, background: m.bg, color: m.c, display: "grid", placeItems: "center", flexShrink: 0 }}>
      {m.i}
    </div>
  );
}

function SeverityChip({ sev }) {
  const map = {
    critical: "red", high: "amber", medium: "blue", low: "",
  };
  return <span className={cx("chip", map[sev])} style={{ fontSize: 10 }}>{sev}</span>;
}

Object.assign(window, { CompliancePage });
