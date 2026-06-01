/* ---------- Admin Dashboard ---------- */
function Admin({ user }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const isSuper = !!(user && user.is_superuser);
  const [platform, setPlatform] = React.useState(null);
  const [overview, setOverview] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!isLoggedIn) { setLoaded(true); return; }
    const load = async () => {
      try {
        if (isSuper) {
          const p = await API.getPlatformOverview();
          setPlatform(p);
        } else {
          const o = await API.getAdminOverview();
          setOverview(o);
        }
      } catch (e) {
        setError(e.message || "Could not load admin data.");
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [isLoggedIn, isSuper]);

  // Super-admin platform view
  if (isSuper) return <PlatformAdmin platform={platform} loaded={loaded} error={error}/>;

  // Regular workspace admin (owner/admin) — real counts from their workspace
  if (isLoggedIn && overview) return <WorkspaceAdmin overview={overview}/>;

  // Logged-in but still loading / no data
  if (isLoggedIn && loaded && !overview) {
    return (
      <div className="page">
        <PageHeader eyebrow="Platform" title="Admin" subtitle="Workspace administration."/>
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
          {error || "Admin data is only available to workspace owners and admins."}
        </div>
      </div>
    );
  }

  // Logged-out demo preview
  return <AdminDemo/>;
}

/* ---- Super-admin: cross-company platform console ---- */
function PlatformAdmin({ platform, loaded, error }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Platform"
        title="Super Admin Console"
        subtitle="Live oversight across every company on TenderPilot."
        actions={<>
          <span className="chip emerald"><span className="chip-dot pulse-dot"/>Super-admin</span>
        </>}
      />

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>{error}</div>
      )}

      {!loaded ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-3)" }}>
          <span className="spin" style={{ display: "inline-block", width: 20, height: 20, borderRadius: 999, border: "2.5px solid var(--border-strong)", borderTopColor: "var(--emerald)" }}/>
        </div>
      ) : platform ? (
        <>
          <div className="grid g-4">
            <KPI label="Companies" value={String(platform.total_companies)}/>
            <KPI label="Users" value={String(platform.total_users)}/>
            <KPI label="Tenders processed" value={String(platform.total_tenders)}/>
            <KPI label="Documents stored" value={String(platform.total_documents)}/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }} className="adm-grid">
            {/* Companies table */}
            <div className="card" style={{ padding: 0 }}>
              <div className="between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Companies</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{platform.companies.length} registered</div>
                </div>
              </div>
              <div className="scrollx">
                <table className="table">
                  <thead><tr><th>Company</th><th>Province</th><th>B-BBEE</th><th>Users</th><th>Tenders</th><th>Docs</th></tr></thead>
                  <tbody>
                    {platform.companies.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px 0", color: "var(--text-3)" }}>No companies yet.</td></tr>
                    )}
                    {platform.companies.map(c => (
                      <tr key={c.id}>
                        <td><div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</div></td>
                        <td style={{ fontSize: 12 }}>{c.province || "—"}</td>
                        <td>{c.bbbee_level ? <span className="chip" style={{ fontSize: 10.5 }}>Level {c.bbbee_level}</span> : "—"}</td>
                        <td className="mono tnum">{c.users}</td>
                        <td className="mono tnum">{c.tenders}</td>
                        <td className="mono tnum">{c.documents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System + recent users */}
            <div className="col gap-4">
              <div className="card card-pad">
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>System status</div>
                <div className="col gap-3">
                  <SysRow label="Environment" value={platform.environment} ok={platform.environment === "production"}/>
                  <SysRow label="AI enabled" value={platform.ai_enabled ? "yes" : "no"} ok={platform.ai_enabled}/>
                  <SysRow label="LLM provider" value={platform.llm_provider} ok={platform.llm_provider !== "stub"}/>
                  <SysRow label="Storage" value={platform.storage_backend} ok={platform.storage_backend === "supabase"}/>
                  <SysRow label="New users (30d)" value={String(platform.active_users_30d)} ok={true}/>
                </div>
              </div>

              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 13.5, fontWeight: 600 }}>Recent signups</div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {platform.recent_users.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                      <Avatar name={u.full_name || u.email}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || u.email}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{u.email}</div>
                      </div>
                      {u.is_superuser
                        ? <span className="chip emerald" style={{ fontSize: 10 }}>super</span>
                        : <span className="chip" style={{ fontSize: 10 }}>{u.role}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <style>{`@media (max-width: 1100px){.adm-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

/* ---- Regular workspace admin (owner/admin of one company) ---- */
function WorkspaceAdmin({ overview }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        title="Workspace Admin"
        subtitle="Usage and system status for your workspace."
        actions={<>
          <button className="btn btn-sm btn-primary" onClick={() => { window.location.href = "mailto:?subject=Join%20our%20TenderPilot%20workspace"; }}><Icon.plus size={13}/> Invite user</button>
        </>}
      />
      <div className="grid g-4">
        <KPI label="Users" value={String(overview.total_users)}/>
        <KPI label="Companies" value={String(overview.total_companies)}/>
        <KPI label="Tenders" value={String(overview.total_tenders)}/>
        <KPI label="Documents" value={String(overview.total_documents)}/>
      </div>
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>System status</div>
        <div className="col gap-3">
          <SysRow label="AI enabled" value={overview.ai_enabled ? "yes" : "no"} ok={overview.ai_enabled}/>
          <SysRow label="LLM provider" value={overview.llm_provider} ok={overview.llm_provider !== "stub"}/>
          <SysRow label="Storage" value={overview.storage_backend} ok={true}/>
          <SysRow label="Environment" value={overview.environment} ok={overview.environment === "production"}/>
        </div>
      </div>
    </div>
  );
}

function SysRow({ label, value, ok }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: ok ? "var(--emerald)" : "var(--amber)" }} className={ok ? "pulse-dot" : ""}/>
      <span style={{ flex: 1 }}>{label}</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{value}</span>
    </div>
  );
}

/* ---- Logged-out demo preview ---- */
function AdminDemo() {
  return (
    <div className="page">
      <PageHeader eyebrow="Platform" title="Admin Dashboard" subtitle="Workspace usage, team management and AI system health."/>
      <div style={{ marginBottom: 16, padding: "10px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--text-3)" }}>
        <Icon.info size={14} style={{ flexShrink: 0 }}/>
        <span>Sign in as a workspace admin to see real usage. Platform super-admins see cross-company oversight here.</span>
      </div>
      <div className="grid g-4">
        <KPI label="Active users" value="—"/>
        <KPI label="Tenders processed" value="—"/>
        <KPI label="Documents" value="—"/>
        <KPI label="Companies" value="—"/>
      </div>
    </div>
  );
}

Object.assign(window, { Admin });
