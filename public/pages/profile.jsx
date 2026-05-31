/* ---------- Company Profile ---------- */
function CompanyProfile() {
  const [company, setCompany] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    API.getCompany().then(c => { if (c) { setCompany(c); setForm(c); } }).catch(() => {});
  }, []);

  const setField = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = async () => {
    if (!window.API || !API.isLoggedIn()) return;
    setSaving(true); setError(null);
    const payload = {
      name: form.name, registration_number: form.registration_number,
      vat_number: form.vat_number, csd_number: form.csd_number,
      industry: form.industry, province: form.province,
      contact_email: form.contact_email, contact_phone: form.contact_phone,
      bbbee_level: form.bbbee_level ? parseInt(form.bbbee_level) : undefined,
    };
    try {
      let updated;
      if (company) {
        updated = await API.updateCompany(payload);
      } else {
        updated = await API.createCompany({ name: form.name || "My Company", ...payload });
      }
      setCompany(updated); setForm(updated); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Completeness from real filled fields
  const coreFields = ["name", "registration_number", "vat_number", "csd_number", "industry", "province", "contact_email", "contact_phone"];
  const filled = coreFields.filter(k => form[k]).length;
  const completeness = Math.round((filled / coreFields.length) * 100);
  const sections = [
    { id: "info", t: "Company information", done: !!(form.name && form.registration_number) },
    { id: "industry", t: "Industry & services", done: !!form.industry },
    { id: "bbbee", t: "B-BBEE & ownership", done: !!form.bbbee_level },
    { id: "contact", t: "Contact details", done: !!(form.contact_email && form.contact_phone) },
    { id: "tax", t: "Tax & registration", done: !!(form.vat_number && form.csd_number) },
    { id: "geo", t: "Province", done: !!form.province },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Company"
        title="Company Profile"
        subtitle="Your master record. Used to auto-fill SBD forms, eligibility checks, and AI proposal drafting."
        actions={<>
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            <Icon.check size={13}/> {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </>}
      />

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>{error}</div>
      )}

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
              }}>{form.name ? form.name.slice(0,2).toUpperCase() : "?"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.014em" }}>{form.name || "Your Company"}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{form.province || "Complete your profile below"}</div>
              </div>
            </div>
            <div className="grid g-2">
              <EditableField label="Legal name" value={form.name || ""} onChange={v => setField("name", v)} placeholder="Company (Pty) Ltd"/>
              <EditableField label="Registration number" value={form.registration_number || ""} onChange={v => setField("registration_number", v)} placeholder="2019/123456/07" mono/>
              <EditableField label="VAT number" value={form.vat_number || ""} onChange={v => setField("vat_number", v)} placeholder="4xxxxxxxxx" mono/>
              <EditableField label="CSD number" value={form.csd_number || ""} onChange={v => setField("csd_number", v)} placeholder="MAAAxxxxxxx" mono/>
              <EditableField label="Primary industry" value={form.industry || ""} onChange={v => setField("industry", v)} placeholder="ICT / Construction / Security"/>
              <EditableField label="Province" value={form.province || ""} onChange={v => setField("province", v)} placeholder="Gauteng"/>
              <EditableField label="Contact email" value={form.contact_email || ""} onChange={v => setField("contact_email", v)} placeholder="bids@company.co.za"/>
              <EditableField label="Contact phone" value={form.contact_phone || ""} onChange={v => setField("contact_phone", v)} placeholder="+27 11 000 0000" mono/>
            </div>
          </div>

          {/* Transformation & capacity */}
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>B-BBEE &amp; capacity</div>
            <div className="grid g-2">
              <div>
                <div className="label">B-BBEE level (1–8)</div>
                <select className="input" value={form.bbbee_level || ""} onChange={e => setField("bbbee_level", e.target.value)}>
                  <option value="">Not set</option>
                  {[1,2,3,4,5,6,7,8].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
              <EditableField label="CIDB grading" value={form.cidb_grading || ""} onChange={v => setField("cidb_grading", v)} placeholder="e.g. 7GB (or N/A)"/>
              <EditableField label="Years in operation" value={form.years_experience || ""} onChange={v => setField("years_experience", v)} placeholder="e.g. 7"/>
              <EditableField label="Employees" value={form.employee_count || ""} onChange={v => setField("employee_count", v)} placeholder="e.g. 24"/>
              <EditableField label="Annual turnover" value={form.annual_turnover || ""} onChange={v => setField("annual_turnover", v)} placeholder="e.g. R 12M" wide/>
            </div>
          </div>

          {/* Capability statement */}
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Capability statement</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12 }}>Used by AI to draft proposals and match you to tenders.</div>
            <textarea
              className="input"
              value={form.capability_statement || ""}
              onChange={e => setField("capability_statement", e.target.value)}
              placeholder="Describe your company's core services, experience and differentiators…"
              rows={5}
              style={{ resize: "vertical", lineHeight: 1.6 }}
            />
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

function EditableField({ label, value, onChange, placeholder, mono, wide }) {
  return (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <div className="label">{label}</div>
      <input
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontFamily: mono ? "var(--font-mono)" : "inherit" }}
      />
    </div>
  );
}

Object.assign(window, { CompanyProfile });
