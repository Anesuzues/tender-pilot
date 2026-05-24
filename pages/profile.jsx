/* ---------- Company Profile ---------- */
function CompanyProfile() {
  const completeness = 84;
  const sections = [
    { id: "info", t: "Company information", done: true },
    { id: "industry", t: "Industry & services", done: true },
    { id: "bbbee", t: "B-BBEE & ownership", done: true },
    { id: "certs", t: "Certifications", done: true },
    { id: "team", t: "Team & capacity", done: false },
    { id: "geo", t: "Geographic coverage", done: true },
    { id: "cap", t: "Capability statements", done: false },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Company"
        title="Company Profile"
        subtitle="Your master record. Used to auto-fill SBD forms, eligibility checks, and AI proposal drafting."
        actions={<>
          <button className="btn btn-sm"><Icon.download size={13}/> Export profile</button>
          <button className="btn btn-sm btn-primary"><Icon.check size={13}/> Save changes</button>
        </>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }} className="cp-grid">
        {/* Sidebar */}
        <aside>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <Ring value={completeness} size={56} stroke={6}/>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Profile {completeness}% complete</div>
                <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>2 sections need attention</div>
              </div>
            </div>
            <Bar value={completeness}/>
          </div>
          <div className="card" style={{ padding: 8 }}>
            {sections.map(s => (
              <div key={s.id} className={cx("nav-item")} style={{ margin: 0, fontSize: 12.5 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                  background: s.done ? "var(--emerald-soft)" : "var(--surface-2)",
                  color: s.done ? "var(--emerald)" : "var(--text-3)",
                  display: "grid", placeItems: "center",
                }}>
                  {s.done ? <Icon.check size={10}/> : <Icon.alert size={9}/>}
                </div>
                <span style={{ flex: 1 }}>{s.t}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="col gap-4">
          {/* Company info card */}
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Company information</div>
            <div style={{ display: "flex", gap: 18, marginBottom: 22 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 14,
                background: "linear-gradient(135deg, var(--navy), var(--navy-2))",
                color: "white", display: "grid", placeItems: "center",
                fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em",
                flexShrink: 0,
              }}>SC</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.014em" }}>Sandile Cybersecurity (Pty) Ltd</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>Centurion, Gauteng · Founded 2019 · 24 staff</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <span className="chip emerald"><span className="chip-dot"/>Active</span>
                  <span className="chip">CIPC verified</span>
                  <span className="chip blue"><Icon.sparkles size={10}/>CSD synced</span>
                </div>
              </div>
              <button className="btn btn-sm">Change logo</button>
            </div>
            <div className="grid g-2">
              <Field label="Legal name" value="Sandile Cybersecurity (Pty) Ltd"/>
              <Field label="Registration number" value="2019/487112/07" mono/>
              <Field label="VAT number" value="4 8104 81729" mono/>
              <Field label="CSD number" value="MAAA0451729" mono/>
              <Field label="Trading address" value="Block C, Lakefield Office Park, Centurion 0157" wide/>
              <Field label="Postal address" value="PO Box 11442, Centurion 0046" wide/>
              <Field label="Email" value="bids@sandilecyber.co.za"/>
              <Field label="Phone" value="+27 12 941 8200" mono/>
            </div>
          </div>

          {/* Industry */}
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Industry & services</div>
            <div className="grid g-2" style={{ marginBottom: 16 }}>
              <Field label="Primary industry" value="Information & Communication Technology"/>
              <Field label="SIC code" value="62020" mono/>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 8 }}>Services offered</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Managed SOC","Network security","Endpoint protection","Penetration testing","Compliance consulting","Incident response","Cloud security","Identity & access","Threat intelligence"].map(s => (
                <span key={s} className="chip" style={{ fontSize: 11.5 }}>{s} <Icon.x size={10} style={{ color: "var(--text-3)" }}/></span>
              ))}
              <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}><Icon.plus size={11}/> Add service</button>
            </div>
          </div>

          {/* B-BBEE */}
          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>B-BBEE &amp; transformation</div>
              <span className="chip emerald">Level 2 · 125% recognition</span>
            </div>
            <div className="grid g-4">
              {[
                { l: "Black ownership", v: "62%" },
                { l: "Black female ownership", v: "31%" },
                { l: "Youth ownership", v: "18%" },
                { l: "EME / QSE", v: "QSE" },
              ].map((s, i) => (
                <div key={i} style={{ padding: 14, background: "var(--surface-2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: "-0.02em" }} className="tnum">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: "18px 0" }}/>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 10 }}>Verification certificates</div>
            <div className="col gap-2">
              <CertRow t="B-BBEE Verification Affidavit (EME · 2025)" e="Expires 8 Jun 2026" status="expiring"/>
              <CertRow t="ISO 27001:2022" e="Expires 12 Nov 2027" status="valid"/>
              <CertRow t="ISO 9001:2015" e="Expires 4 Mar 2028" status="valid"/>
              <CertRow t="CIDB Grading" e="N/A — IT services" status="valid"/>
            </div>
          </div>

          {/* Geographic */}
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Geographic coverage</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"].map(p => {
                const active = ["Gauteng","Western Cape","KwaZulu-Natal"].includes(p);
                return (
                  <div key={p} style={{
                    padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 7,
                    background: active ? "var(--emerald-soft)" : "var(--surface)",
                    color: active ? "var(--emerald)" : "var(--text-2)",
                    fontSize: 12.5, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {active ? <Icon.check size={12}/> : <Icon.x size={11} style={{ opacity: .4 }}/>}
                    {p}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px){.cp-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

function Field({ label, value, mono, wide }) {
  return (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <div className="label">{label}</div>
      <div style={{
        padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 7,
        background: "var(--surface)", fontSize: 13, color: "var(--text)",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
      }}>{value}</div>
    </div>
  );
}

function CertRow({ t, e, status }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 7, gap: 12, background: "var(--surface)" }}>
      <Icon.shield size={14} style={{ color: status === "valid" ? "var(--emerald)" : "var(--amber)" }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{e}</div>
      </div>
      <StatusChip status={status}/>
      <button className="btn btn-sm btn-ghost btn-icon"><Icon.more size={12}/></button>
    </div>
  );
}

Object.assign(window, { CompanyProfile });
