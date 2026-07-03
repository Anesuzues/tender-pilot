/* ---------- Discover Tenders (live National Treasury eTenders feed) ---------- */
function DiscoverTenders({ onNav, user }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [province, setProvince] = React.useState("");
  const [closing, setClosing] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [importing, setImporting] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState(null);
  const PAGE = 25;

  const load = React.useCallback(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    const params = { limit: PAGE, offset: page * PAGE };
    if (q) params.q = q;
    if (province) params.province = province;
    if (closing) params.closing_within_days = closing;
    API.getPublicTenders(params)
      .then(r => { setItems(r.items || []); setTotal(r.total || 0); })
      .catch(e => setError(e.message || "Could not load the tender feed."))
      .finally(() => setLoading(false));
  }, [q, province, closing, page, isLoggedIn]);

  React.useEffect(() => { const t = setTimeout(load, q ? 350 : 0); return () => clearTimeout(t); }, [load]);

  const doImport = async (pt) => {
    setImporting(pt.id); setError(null);
    try {
      const t = await API.importPublicTender(pt.id);
      window.toast && toast("Imported — opening analysis…");
      onNav("analysis", { tenderId: t._apiId });
    } catch (e) {
      setError(e.message || "Import failed.");
    } finally {
      setImporting(null);
    }
  };

  const doSync = async () => {
    setSyncing(true); setError(null);
    try {
      const r = await API.syncPublicTenders();
      window.toast && toast(`Feed refreshed: ${r.created} new, ${r.updated} updated`);
      load();
    } catch (e) {
      setError(e.message || "Sync failed (super-admin only).");
    } finally {
      setSyncing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--emerald-soft)", color: "var(--emerald)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
            <Icon.globe size={24}/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Discover live government tenders</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>
            Browse open opportunities straight from the National Treasury eTenders portal, filter by province and closing date, and import any tender for instant AI analysis.
          </div>
          <button className="btn btn-primary" onClick={() => onNav("auth")}>Sign in to browse</button>
        </div>
      </div>
    );
  }

  const provinces = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape","National"];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Discovery"
        title="Discover Tenders"
        subtitle={`Live feed from the National Treasury eTenders portal · ${total} open opportunities`}
        actions={<>
          {user && user.is_superuser && (
            <button className="btn btn-sm" onClick={doSync} disabled={syncing}>
              <Icon.refresh size={13}/> {syncing ? "Syncing…" : "Sync feed now"}
            </button>
          )}
        </>}
      />

      <div style={{ marginBottom: 16, padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-3)" }}>
        <Icon.info size={12} style={{ flexShrink: 0 }}/>
        <span>Source: National Treasury eTenders (OCDS). Data completeness depends on procuring entities — always verify details on the official portal before bidding.</span>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>{error}</div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Icon.search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}/>
          <input className="input" placeholder="Search title, buyer, category…" value={q}
                 onChange={e => { setQ(e.target.value); setPage(0); }} style={{ paddingLeft: 32, width: 280 }}/>
        </div>
        <select className="input" style={{ width: 170 }} value={province} onChange={e => { setProvince(e.target.value); setPage(0); }}>
          <option value="">All provinces</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input" style={{ width: 170 }} value={closing} onChange={e => { setClosing(e.target.value); setPage(0); }}>
          <option value="">Any closing date</option>
          <option value="7">Closing in 7 days</option>
          <option value="14">Closing in 14 days</option>
          <option value="30">Closing in 30 days</option>
        </select>
        <div style={{ flex: 1 }}/>
        {loading && <span style={{ fontSize: 11, color: "var(--text-3)" }}>Loading…</span>}
      </div>

      {/* Results */}
      {!loading && items.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)" }}>
          <Icon.globe size={24} style={{ opacity: .4, marginBottom: 10 }}/>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
            {total === 0 && !q && !province && !closing ? "The feed hasn't been synced yet" : "No tenders match these filters"}
          </div>
          <div style={{ fontSize: 12.5 }}>
            {total === 0 && !q && !province && !closing
              ? "The feed refreshes automatically every morning."
              : "Try broadening your search."}
          </div>
        </div>
      ) : (
        <div className="col gap-3">
          {items.map(pt => (
            <div key={pt.id} className="card card-pad" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "grid", placeItems: "center", flexDirection: "column",
              }}>
                {pt.closing_days != null ? (
                  <>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: pt.closing_days <= 7 ? "var(--red)" : pt.closing_days <= 14 ? "var(--amber)" : "var(--emerald)" }}>{pt.closing_days}</div>
                    <div style={{ fontSize: 7.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: -2 }}>days</div>
                  </>
                ) : <Icon.doc size={18} style={{ color: "var(--text-3)" }}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{pt.ocid}</span>
                  {pt.category && <span className="chip" style={{ fontSize: 10.5 }}>{pt.category}</span>}
                  {pt.province && <span className="chip" style={{ fontSize: 10.5 }}><Icon.globe size={9}/>{pt.province}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{pt.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
                  {pt.buyer || "Unknown buyer"}
                  {pt.deadline ? ` · closes ${pt.deadline}` : ""}
                  {pt.documents && pt.documents.length ? ` · ${pt.documents.length} document${pt.documents.length !== 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {pt.source_url && (
                  <a className="btn btn-sm btn-ghost" href={pt.source_url} target="_blank" rel="noreferrer">
                    <Icon.external size={12}/> Portal
                  </a>
                )}
                <button className="btn btn-sm btn-primary" onClick={() => doImport(pt)} disabled={importing === pt.id}>
                  <Icon.sparkles size={12}/> {importing === pt.id ? "Importing…" : "Import & Analyse"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ fontSize: 12, color: "var(--text-3)", alignSelf: "center" }}>Page {page + 1} of {Math.ceil(total / PAGE)}</span>
          <button className="btn btn-sm" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DiscoverTenders });
