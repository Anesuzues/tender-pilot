/* ---------- Tender Upload ---------- */
function TenderUpload({ onNav }) {
  const [stage, setStage] = React.useState("idle");
  const [progress, setProgress] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadedTender, setUploadedTender] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [recentUploads, setRecentUploads] = React.useState([]);
  const [steps, setSteps] = React.useState([
    { id: "ocr", t: "Scanning pages (OCR)", status: "pending" },
    { id: "ext", t: "Extracting requirements", status: "pending" },
    { id: "comp", t: "Reading compliance criteria", status: "pending" },
    { id: "score", t: "Scoring bid readiness", status: "pending" },
    { id: "draft", t: "Generating proposal outline", status: "pending" },
  ]);
  const fileInputRef = React.useRef();

  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    API.getTenders({ limit: 10 }).then(r => {
      setRecentUploads(r.items.slice(0, 4).map(t => ({ f: t.file_name || t.title, t: t.title, time: t.created_at ? new Date(t.created_at).toLocaleDateString() : "", status: t.status, id: t._apiId })));
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (stage !== "processing") return;
    let i = 0;
    const tick = () => {
      setSteps(s => s.map((st, idx) => idx < i ? { ...st, status: "done" } : idx === i ? { ...st, status: "active" } : st));
      if (i < steps.length) { i++; setTimeout(tick, 1100); }
      else { setStage("done"); }
    };
    tick();
  }, [stage]);

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = async (file) => {
    setError(null);
    setStage("uploading");
    setProgress(0);

    // Simulate progress bar while uploading
    const timer = setInterval(() => {
      setProgress(p => (p >= 85 ? 85 : p + 5));
    }, 200);

    try {
      let tender;
      if (window.API && API.isLoggedIn() && file) {
        tender = await API.uploadTender(file);
        setUploadedTender(tender);
      }
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => setStage("processing"), 300);
    } catch (e) {
      clearInterval(timer);
      setError(e.message || "Upload failed. Please try again.");
      setStage("idle");
    }
  };

  const chooseFile = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  const fileName = selectedFile ? selectedFile.name : "SARS_RFB_2025_IT_0142.pdf";
  const fileSize = selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) + " MB" : "12.4 MB";

  return (
    <div className="page">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.zip,.png,.jpg" style={{ display: "none" }} onChange={handleFileSelect}/>
      <PageHeader
        eyebrow="Add tender"
        title="Upload a tender document"
        subtitle="Drop a PDF, DOCX or scanned image. AI takes 30–90 seconds to extract everything."
      />

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {stage === "idle" && (
        <div className="card" style={{ padding: 0, border: "2px dashed var(--border-strong)", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, var(--surface) 60%, color-mix(in oklab, var(--emerald-soft), var(--surface) 70%))" }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setSelectedFile(f); startUpload(f); } }}
        >
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px", background: "var(--surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center", boxShadow: "var(--shadow-sm)" }}>
              <Icon.upload size={28} style={{ color: "var(--emerald)" }}/>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.014em" }}>Drag &amp; drop your tender file here</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>PDF up to 50MB · also DOCX, ZIP, or scanned images · OCR + AI extract in &lt;2 minutes</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={chooseFile}><Icon.upload size={13}/> Choose file</button>
            </div>
            <div className="row gap-3" style={{ justifyContent: "center", marginTop: 22, fontSize: 11, color: "var(--text-3)" }}>
              <span><Icon.check size={11} style={{ color: "var(--emerald)" }}/> Encrypted at rest</span>
              <span><Icon.check size={11} style={{ color: "var(--emerald)" }}/> POPIA compliant</span>
              <span><Icon.check size={11} style={{ color: "var(--emerald)" }}/> ZA-hosted only</span>
            </div>
          </div>
        </div>
      )}

      {stage === "uploading" && (
        <div className="card card-pad" style={{ padding: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <div style={{ width: 44, height: 56, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, display: "grid", placeItems: "center" }}>
              <Icon.doc size={20} style={{ color: "var(--text-3)" }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{fileName}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{fileSize}</div>
            </div>
            <span className="chip blue">Uploading · {progress}%</span>
          </div>
          <Bar value={progress}/>
        </div>
      )}

      {(stage === "processing" || stage === "done") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }} className="up-grid">
          <div className="card card-pad" style={{ padding: 30 }}>
            <div className="ai-glow" style={{ padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
                <div style={{ fontSize: 13, fontWeight: 600 }}>TenderPilot AI is reading your document</div>
                <span className="chip blue" style={{ marginLeft: "auto", fontSize: 10 }}>{stage === "done" ? "Complete" : "In progress"}</span>
              </div>
              {stage === "processing" && <div style={{ marginTop: 12 }}><AIBar/></div>}
            </div>

            <div className="col gap-3" style={{ marginBottom: 18 }}>
              {steps.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, background: s.status === "done" ? "var(--emerald-soft)" : s.status === "active" ? "var(--blue-soft)" : "var(--surface-2)", color: s.status === "done" ? "var(--emerald)" : s.status === "active" ? "var(--blue)" : "var(--text-3)", border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
                    {s.status === "done" ? <Icon.check size={12}/>
                     : s.status === "active" ? <span className="spin" style={{ width: 11, height: 11, borderRadius: 999, border: "2px solid currentColor", borderTopColor: "transparent" }}/>
                     : <span className="mono" style={{ fontSize: 10 }}>{i+1}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: s.status === "pending" ? "var(--text-3)" : "var(--text)", fontWeight: s.status === "active" ? 600 : 500 }}>{s.t}</div>
                  {s.status === "active" && <span className="mono" style={{ fontSize: 10.5, color: "var(--blue)", marginLeft: "auto" }}>processing</span>}
                  {s.status === "done" && <span className="mono" style={{ fontSize: 10.5, color: "var(--emerald)", marginLeft: "auto" }}>done</span>}
                </div>
              ))}
            </div>

            {stage === "done" && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={() => onNav("analysis", uploadedTender && uploadedTender._apiId ? { tenderId: uploadedTender._apiId } : {})}>
                  <Icon.scan size={13}/> Open tender analysis
                </button>
                <button className="btn" onClick={() => { setStage("idle"); setSelectedFile(null); setUploadedTender(null); setSteps(s => s.map(x => ({ ...x, status: "pending" }))); }}>Upload another</button>
              </div>
            )}
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Preview</div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, height: 320, background: "var(--surface-2)", padding: 16, overflow: "hidden", position: "relative" }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 8 }}>TENDER DOCUMENT</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>{uploadedTender ? uploadedTender.title : fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ")}</div>
              <div style={{ fontSize: 8.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                {Array.from({length:18}).map((_, i) => (<div key={i} style={{ height: 4, background: "var(--border)", borderRadius: 2, width: `${65 + (i * 7) % 30}%`, marginBottom: 3, opacity: 0.5 }}/>))}
              </div>
              {stage === "processing" && (<div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><div className="shimmer" style={{ position: "absolute", inset: 0 }}/></div>)}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="between" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Upload history</div>
        </div>
        <table className="table">
          <thead><tr><th>File</th><th>Tender</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(recentUploads.length > 0 ? recentUploads : [
              { f: "Eskom_SCADA_RFQ_0337.pdf", t: "Maintenance of SCADA Systems", status: "in-review" },
              { f: "JHB_Security_2026.pdf", t: "City of Joburg · Physical Security", status: "draft" },
              { f: "Mthatha_Phase2.zip", t: "DPWI Mthatha Office Phase 2", status: "flagged" },
            ]).map((r, i) => (
              <tr key={i}>
                <td><div className="mono" style={{ fontSize: 12 }}>{r.f || r.title || "—"}</div></td>
                <td style={{ fontSize: 12.5 }}>{r.t}</td>
                <td><StatusChip status={r.status}/></td>
                <td><button className="btn btn-sm btn-ghost btn-icon" onClick={() => r.id ? onNav("analysis", { tenderId: r.id }) : (window.toast && toast("Open this tender from the Tenders list."))}><Icon.more size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@media (max-width: 1000px){.up-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

Object.assign(window, { TenderUpload });
