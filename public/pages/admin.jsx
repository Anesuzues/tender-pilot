/* ---------- Admin Dashboard ---------- */
function Admin() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Platform"
        title="Admin Dashboard"
        subtitle="Workspace usage, billing, team management and AI system health."
        actions={<>
          <button className="btn btn-sm" onClick={() => window.toast && toast("Audit log export — available on the Enterprise plan.")}><Icon.download size={13}/> Audit log</button>
          <button className="btn btn-sm btn-primary" onClick={() => { window.location.href = "mailto:?subject=Join%20our%20TenderPilot%20workspace&body=I'd%20like%20to%20invite%20you%20to%20our%20TenderPilot%20workspace."; }}><Icon.plus size={13}/> Invite user</button>
        </>}
      />

      <div style={{ marginBottom: 16, padding: "10px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--text-3)" }}>
        <Icon.info size={14} style={{ flexShrink: 0 }}/>
        <span>Admin metrics below are demo data. Real platform analytics will populate once connected to a production analytics pipeline.</span>
      </div>

      {/* Platform metrics */}
      <div className="grid g-4">
        <KPI label="Active users" value="287" delta="+24" deltaDir="up" spark={[120,135,148,162,180,200,218,240,265,287]}/>
        <KPI label="Tenders processed (mo)" value="1,842" delta="+382" deltaDir="up" spark={[800,920,1050,1180,1320,1460,1560,1700,1790,1842]}/>
        <KPI label="AI tokens used" value="12.4M" delta="+2.8M" deltaDir="up" spark={[6,7,8,9,10,11,12,12,12,12]}/>
        <KPI label="MRR" value="R 482k" delta="+R 78k" deltaDir="up" spark={[280,310,340,360,380,400,420,445,468,482]}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }} className="adm-grid">
        {/* Users */}
        <div className="card" style={{ padding: 0 }}>
          <div className="between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>User management</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>11 seats in use across 3 companies</div>
            </div>
            <button className="btn btn-sm" onClick={() => window.toast && toast("User filtering — available on the Enterprise plan.")}><Icon.filter size={12}/> Filter</button>
          </div>
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Company</th><th>Tenders</th><th>Last active</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "Lerato Mokoena", r: "Admin", c: "Sandile Cybersecurity", t: 14, l: "Just now" },
                { n: "Sipho Ndlovu", r: "Bid lead", c: "Sandile Cybersecurity", t: 8, l: "23 min" },
                { n: "Thandi Khumalo", r: "Editor", c: "Sandile Cybersecurity", t: 5, l: "1 h" },
                { n: "Pieter v.d. Merwe", r: "Owner", c: "NorthOps Engineering", t: 22, l: "2 h" },
                { n: "Asha Naidoo", r: "Compliance", c: "Mzansi ICT", t: 4, l: "Yesterday" },
              ].map((u, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={u.n}/>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{u.n}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{u.n.toLowerCase().replace(/\s/g,".").replace(/\./g,".")}@{u.c.split(" ")[0].toLowerCase()}.co.za</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip" style={{ fontSize: 11 }}>{u.r}</span></td>
                  <td style={{ fontSize: 12.5 }}>{u.c}</td>
                  <td className="mono tnum">{u.t}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{u.l}</td>
                  <td><button className="btn btn-sm btn-ghost btn-icon" onClick={() => window.toast && toast("User management actions — Enterprise plan.")}><Icon.more size={12}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System health */}
        <div className="col gap-4">
          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>System health</div>
            <div className="col gap-3">
              {[
                { s: "API gateway", v: "99.97%", status: "ok" },
                { s: "AI inference (Haiku 4.5)", v: "892 ms avg", status: "ok" },
                { s: "OCR pipeline", v: "98.2% accuracy", status: "ok" },
                { s: "PDF parser", v: "12 retries / hr", status: "warn" },
                { s: "CSD sync", v: "Last 14 min ago", status: "ok" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: s.status === "ok" ? "var(--emerald)" : "var(--amber)",
                  }} className={s.status === "ok" ? "pulse-dot" : ""}/>
                  <span style={{ flex: 1 }}>{s.s}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>AI usage breakdown</div>
              <span className="chip">last 7 days</span>
            </div>
            <div className="col gap-3">
              {[
                { l: "Tender parsing", v: 4280000, pct: 34 },
                { l: "Proposal drafting", v: 3850000, pct: 31 },
                { l: "Q&A chat", v: 2210000, pct: 18 },
                { l: "Compliance check", v: 1450000, pct: 12 },
                { l: "Other", v: 610000, pct: 5 },
              ].map((s, i) => (
                <div key={i}>
                  <div className="between" style={{ marginBottom: 5, fontSize: 12 }}>
                    <span>{s.l}</span>
                    <span className="mono tnum" style={{ color: "var(--text-3)" }}>{(s.v / 1000000).toFixed(2)}M tokens</span>
                  </div>
                  <Bar value={s.pct} color="var(--emerald)"/>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Revenue (last 30 days)</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <div className="tnum" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em" }}>R 482,420</div>
              <span className="chip emerald" style={{ fontSize: 10 }}><Icon.trending size={9}/>+19%</span>
            </div>
            <Sparkline data={[280000,310000,340000,360000,380000,400000,420000,445000,468000,482000]} width={300} height={60} color="var(--emerald)"/>
            <div className="divider" style={{ margin: "14px 0" }}/>
            <div className="col gap-2" style={{ fontSize: 12 }}>
              <div className="between"><span className="muted">Professional plan</span><span className="mono tnum">R 312,400</span></div>
              <div className="between"><span className="muted">Agency plan</span><span className="mono tnum">R 132,020</span></div>
              <div className="between"><span className="muted">Starter plan</span><span className="mono tnum">R 38,000</span></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 1100px){.adm-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

Object.assign(window, { Admin });
