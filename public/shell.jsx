/* ---------- App shell: Sidebar + Topbar + Command Palette ---------- */
const { useState: useState_s, useEffect: useEffect_s, useRef: useRef_s } = React;

function Sidebar({ activePage, onNav, user, onLogout, mobileOpen, onMobileClose }) {
  const displayName = (user && (user.full_name || user.email)) || "";
  const displayCompany = (user && user.company_name) || "";
  const initials = displayName ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div onClick={onMobileClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
          zIndex: 49, display: "none"
        }} className="sidebar-backdrop"/>
      )}
      <aside className={cx("sidebar", mobileOpen && "sidebar-mobile-open")}>
        <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: "var(--navy)",
            display: "grid", placeItems: "center", color: "white", flexShrink: 0,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 14L11 7L15 11L20 6" stroke="var(--emerald-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="6" r="2" fill="var(--emerald-2)"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.012em", lineHeight: 1 }}>TenderPilot</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, letterSpacing: ".05em" }}>AI</div>
          </div>
          {mobileOpen && (
            <button className="btn btn-ghost btn-icon" onClick={onMobileClose} style={{ marginLeft: "auto" }}>
              <Icon.x size={15}/>
            </button>
          )}
        </div>

        <div style={{ padding: "0 10px 8px" }}>
          <button className="btn" style={{ width: "100%", justifyContent: "flex-start", color: "var(--text-2)" }}
                  onClick={() => { window.dispatchEvent(new CustomEvent("open-cmd")); onMobileClose && onMobileClose(); }}>
            <Icon.search size={13}/>
            <span style={{ flex: 1, textAlign: "left", fontWeight: 400 }}>Search…</span>
            <span style={{ display: "inline-flex", gap: 3 }}>
              <span className="kbd">⌘</span><span className="kbd">K</span>
            </span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
          {NAV.map((s, si) => (
            <div key={si}>
              <div className="nav-section">{s.section}</div>
              {s.items.map(it => (
                <div key={it.id}
                     className={cx("nav-item", activePage === it.id && "active")}
                     onClick={() => { onNav(it.id); onMobileClose && onMobileClose(); }}>
                  <span className="icon">{Icon[it.icon] && Icon[it.icon]({ size: 15 })}</span>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge && (
                    <span className="chip blue" style={{ padding: "1px 6px", fontSize: 9.5, fontWeight: 600, letterSpacing: ".04em" }}>{it.badge}</span>
                  )}
                  {it.count && <span className="count tnum">{it.count}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: 10, borderTop: "1px solid var(--border)" }}>
          <div className="ai-glow" style={{ padding: 12, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
              <div style={{ fontSize: 12, fontWeight: 600 }}>TenderPilot AI</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 8 }}>
              Upgrade to unlock unlimited AI analysis, proposal drafting and compliance reports.
            </div>
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => { onNav("pricing"); onMobileClose && onMobileClose(); }}>
              View plans
            </button>
          </div>
        </div>

        <div style={{ padding: "8px 10px 12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={displayName || "User"}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName || "My Account"}
            </div>
            {displayCompany && (
              <div style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayCompany}</div>
            )}
          </div>
          {onLogout && (
            <button className="btn btn-ghost btn-icon" title="Sign out" onClick={onLogout}>
              <Icon.logout size={14}/>
            </button>
          )}
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .sidebar-backdrop { display: block !important; }
          .sidebar { transform: translateX(-100%); transition: transform .22s ease; position: fixed; top: 0; left: 0; height: 100vh; z-index: 50; }
          .sidebar-mobile-open { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  );
}

function Topbar({ pageTitle, breadcrumb, onCmd, onTheme, theme, user, onLogout, onMenu }) {
  const displayName = (user && (user.full_name || user.email)) || "";
  return (
    <div className="topbar">
      <button className="btn btn-ghost btn-icon topbar-menu-btn" onClick={onMenu} title="Menu">
        <Icon.panelLeft size={16}/>
      </button>
      <div className="row gap-2" style={{ fontSize: 13, color: "var(--text-2)" }}>
        {breadcrumb ? breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            <span style={{ color: i === breadcrumb.length - 1 ? "var(--text)" : "var(--text-2)", fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>{b}</span>
            {i < breadcrumb.length - 1 && <Icon.chev size={12} style={{ color: "var(--text-3)" }}/>}
          </React.Fragment>
        )) : pageTitle}
      </div>
      <div style={{ flex: 1 }}/>
      <button className="btn btn-ghost btn-sm topbar-search-btn" onClick={onCmd}>
        <Icon.search size={13}/>
        <span className="topbar-search-label">Quick find</span>
        <span style={{ display: "inline-flex", gap: 3, marginLeft: 4 }} className="topbar-search-kbd">
          <span className="kbd">⌘</span><span className="kbd">K</span>
        </span>
      </button>
      <button className="btn btn-ghost btn-icon" title="Toggle theme" onClick={onTheme}>
        {theme === "dark" ? <Icon.sun size={15}/> : <Icon.moon size={15}/>}
      </button>
      <div className="vdivider" style={{ height: 22, margin: "0 4px" }}/>
      <Avatar name={displayName || "User"}/>

      <style>{`
        .topbar-menu-btn { display: none; }
        @media (max-width: 900px) {
          .topbar-menu-btn { display: flex; }
          .topbar-search-label { display: none; }
          .topbar-search-kbd { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Command palette ---------- */
function CommandPalette({ open, onClose, onNav, tenders }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    if (open) setQ("");
  }, [open]);

  const realTenders = (tenders && tenders.length > 0) ? tenders : [];
  const mockFallback = (!window.API || !API.isLoggedIn()) ? TENDERS : [];
  const tenderItems = (realTenders.length ? realTenders : mockFallback)
    .map(t => ({ id: t._apiId || t.id, label: t.title, kind: "Tender", to: "analysis", icon: "doc",
      tenderId: t._apiId || null }));

  const allItems = [
    ...NAV.flatMap(s => s.items.map(i => ({ ...i, kind: "Navigate" }))),
    ...tenderItems,
    { id: "new-tender", label: "Upload new tender…", kind: "Action", to: "upload", icon: "upload" },
    { id: "new-chat", label: "Ask AI a question", kind: "Action", to: "chat", icon: "spark" },
    { id: "compliance", label: "Open Compliance dashboard", kind: "Action", to: "compliance", icon: "shield" },
  ];

  const filtered = q
    ? allItems.filter(i => (i.label + " " + (i.id || "")).toLowerCase().includes(q.toLowerCase()))
    : allItems.slice(0, 10);

  if (!open) return null;
  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)", gap: 10 }}>
          <Icon.search size={15} style={{ color: "var(--text-3)" }}/>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search tenders, documents, actions…"
                 style={{ flex: 1, border: 0, background: "transparent", outline: "none", fontSize: 14 }}/>
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>No results</div>}
          {filtered.map((it, i) => (
            <div key={i}
                 onClick={() => {
                   if (it.to) onNav(it.to, it.tenderId ? { tenderId: it.tenderId } : {});
                   onClose();
                 }}
                 style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, cursor: "pointer" }}
                 onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width: 22, color: "var(--text-3)" }}>
                {Icon[it.icon] ? Icon[it.icon]({ size: 14 }) : <Icon.arrow size={13}/>}
              </div>
              <div style={{ flex: 1, fontSize: 13 }}>{it.label}</div>
              <span className="chip" style={{ fontSize: 10 }}>{it.kind}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", color: "var(--text-3)", fontSize: 11.5 }}>
          <div className="row gap-3">
            <span><span className="kbd">↑</span> <span className="kbd">↓</span> Navigate</span>
            <span><span className="kbd">↵</span> Open</span>
          </div>
          <span>TenderPilot AI</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, CommandPalette });
