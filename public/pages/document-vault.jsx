/* ---------- Document Vault ---------- */
function DocumentVault({ onNav }) {
  const isLoggedIn = window.API && API.isLoggedIn();
  const [filter, setFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [allDocs, setAllDocs] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef();

  React.useEffect(() => {
    if (!isLoggedIn) return;
    API.getDocuments().then(docs => { setAllDocs(docs || []); }).catch(() => {});
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!isLoggedIn) { setError("Sign in to upload documents."); e.target.value = ""; return; }
    setUploading(true); setError(null);
    try {
      const raw = await API.uploadDocument(file, "Other", file.name);
      const doc = window.normalizeDoc ? window.normalizeDoc(raw) : raw;
      setAllDocs(d => [...d, doc]);
      window.toast && toast(`Uploaded · classified as ${doc.category}`);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadDoc = async (d) => {
    if (!isLoggedIn || !d.id) { window.toast && toast("Sign in to download."); return; }
    try { const b = await API.downloadDocumentFile(d.id); window.downloadBlob(b, d.name || "document"); }
    catch { window.toast && toast("Could not download this document."); }
  };

  const deleteDoc = async (d) => {
    if (!isLoggedIn || !d.id) return;
    try { await API.deleteDocument(d.id); setAllDocs(list => list.filter(x => x.id !== d.id)); window.toast && toast("Document deleted"); }
    catch { window.toast && toast("Could not delete."); }
  };

  const catIds = ["all","CSD","Tax","B-BBEE","CIPC","Insurance","Bank Letter","SBD Forms","Capability"];
  const categories = catIds.map(id => ({
    id, label: id === "all" ? "All" : id,
    count: id === "all" ? allDocs.length : allDocs.filter(d => d.category === id).length,
  }));

  const STATUS_CYCLE = ["all", "valid", "expiring", "expired", "missing"];
  const cycleStatus = () => setStatusFilter(s => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length]);

  const docs = allDocs
    .filter(d => filter === "all" || d.category === filter)
    .filter(d => statusFilter === "all" || d.status === statusFilter)
    .filter(d => !search || (d.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.jpg,.png" style={{ display: "none" }} onChange={handleFileChange}/>
      <PageHeader
        eyebrow="Compliance"
        title="Document Vault"
        subtitle="Encrypted vault of every compliance document. Versioned, expiry-tracked, AI-validated."
        actions={
          <>
            <button className="btn btn-sm" onClick={() => exportVaultCsv(allDocs)} disabled={allDocs.length === 0}>
              <Icon.download size={13}/> Export bundle
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={uploading}>
              <Icon.plus size={13}/> {uploading ? "Uploading…" : "Upload document"}
            </button>
          </>
        }
      />

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>{error}</div>
      )}

      {/* Stats */}
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <KPI label="Documents stored" value={String(allDocs.length)} delta="+2" deltaDir="up" spark={[7,8,8,9,9,10,11,11]}/>
        <KPI label="Valid & in-date" value={String(allDocs.filter(d => d.status === "valid").length)} delta="0" deltaDir="up"/>
        <KPI label="Expiring < 30 days" value={String(allDocs.filter(d => d.status === "expiring").length)} delta="+2" deltaDir="down"/>
        <KPI label="Missing" value={String(allDocs.filter(d => d.status === "missing").length)} delta="-1" deltaDir="up"/>
      </div>

      {/* Upload zone */}
      <div className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
          background: "linear-gradient(135deg, var(--surface), color-mix(in oklab, var(--emerald-soft), var(--surface) 80%))",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "var(--surface)",
            border: "1px dashed var(--border-strong)", display: "grid", placeItems: "center",
            color: "var(--emerald)",
          }}>
            <Icon.upload size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Drop documents to upload</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
              PDF, DOCX, JPG up to 25MB · AI auto-classifies, OCRs, and extracts expiry dates
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-sm btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Choose files</button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Icon.search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}/>
          <input className="input" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 260 }}/>
        </div>
        <div className="vdivider" style={{ height: 22 }}/>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
                    className={cx("btn btn-sm", filter === c.id ? "btn-dark" : "btn-ghost")}>
              {c.label}
              <span className="mono" style={{ opacity: .6, marginLeft: 4 }}>{c.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm btn-ghost" onClick={cycleStatus}>
          <Icon.filter size={12}/> Status{statusFilter !== "all" ? `: ${statusFilter}` : ""}
        </button>
      </div>

      {/* Document grid */}
      {docs.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)" }}>
          <Icon.doc size={24} style={{ opacity: .4, marginBottom: 10 }}/>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
            {allDocs.length === 0 ? "Your vault is empty" : "No documents match these filters"}
          </div>
          <div style={{ fontSize: 12.5, marginBottom: 16 }}>
            {allDocs.length === 0 ? "Upload your compliance documents — AI auto-classifies them." : "Try clearing the search or status filter."}
          </div>
          {allDocs.length === 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              <Icon.upload size={12}/> Upload a document
            </button>
          )}
        </div>
      ) : (
        <div className="grid g-3">
          {docs.map(d => <DocCard key={d.id} d={d} onDownload={() => downloadDoc(d)} onDelete={() => deleteDoc(d)} onUpload={() => fileInputRef.current && fileInputRef.current.click()}/>)}
        </div>
      )}
    </div>
  );
}

function DocCard({ d, onDownload, onDelete, onUpload }) {
  const isMissing = d.status === "missing";
  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", minHeight: 200, position: "relative", opacity: isMissing ? 0.92 : 1 }}>
      {/* Preview */}
      <div style={{
        height: 96, borderRadius: 8, marginBottom: 14,
        background: isMissing ? "var(--surface-2)" : "linear-gradient(135deg, var(--surface-2), var(--bg))",
        border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {isMissing ? (
          <div style={{ color: "var(--text-3)", fontSize: 11, textAlign: "center" }}>
            <Icon.alert size={20} style={{ color: "var(--red)", margin: "0 auto 6px" }}/>
            <div>No file uploaded</div>
          </div>
        ) : (
          <>
            <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 2, background: "var(--border-strong)", borderRadius: 2, width: `${60 + (i * 13) % 30}%`, opacity: 0.6 - i * 0.07 }}/>
              ))}
            </div>
            <Icon.doc size={26} style={{ color: "var(--text-3)", opacity: .55, position: "absolute", bottom: 10, right: 12 }}/>
          </>
        )}
        {d.aiVerified && (
          <span className="chip blue" style={{ position: "absolute", top: 8, right: 8, fontSize: 10 }}>
            <Icon.sparkles size={9}/> AI verified
          </span>
        )}
      </div>

      <div className="between" style={{ marginBottom: 6 }}>
        <span className="chip" style={{ fontSize: 10.5 }}>{d.category}</span>
        <StatusChip status={d.status}/>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35 }}>{d.name}</div>
      {d.vendor && <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>{d.vendor}</div>}

      <div style={{ flex: 1 }}/>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-3)" }}>
        {d.expires ? (
          <span>{d.status === "expired" ? "Expired " : d.status === "expiring" ? "Expires " : "Valid until "} <b className="mono" style={{ color: d.status === "expired" || d.status === "expiring" ? d.status === "expired" ? "var(--red)" : "var(--amber)" : "var(--text-2)" }}>{d.expires}</b></span>
        ) : <span>No expiry</span>}
        {d.size && <span className="mono">{d.size}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {isMissing ? (
          <>
            <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={onUpload}><Icon.upload size={11}/>Upload</button>
          </>
        ) : (
          <>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={onDownload}><Icon.download size={11}/>Download</button>
            <button className="btn btn-sm btn-ghost btn-icon" title="Delete" onClick={onDelete}><Icon.trash size={12}/></button>
          </>
        )}
      </div>
    </div>
  );
}

function exportVaultCsv(docs) {
  if (!docs || docs.length === 0) return;
  const rows = [["Name", "Category", "Status", "Expires", "Uploaded", "Size", "AI verified"]];
  docs.forEach(d => rows.push([
    d.name || "", d.category || "", d.status || "",
    d.expires || "", d.uploaded || "", d.size || "", d.aiVerified ? "yes" : "no",
  ]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "compliance-vault.csv";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

Object.assign(window, { DocumentVault });
