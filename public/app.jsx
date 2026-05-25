/* ---------- App root ---------- */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [route, setRoute] = useStateApp("landing");
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("tp-theme") || "light");
  const [cmdOpen, setCmdOpen] = useStateApp(false);
  const [user, setUser] = useStateApp(null);
  const [activeTenderId, setActiveTenderId] = useStateApp(null);

  // Restore session from stored token
  useEffectApp(() => {
    if (window.API && API.isLoggedIn()) {
      API.me()
        .then(u => { setUser(u); setRoute("dashboard"); })
        .catch(() => { API.logout(); });
    }
  }, []);

  useEffectApp(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tp-theme", theme);
  }, [theme]);

  useEffectApp(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    const openCmd = () => setCmdOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmd", openCmd);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-cmd", openCmd); };
  }, []);

  const navigate = (page, meta) => {
    if (meta && meta.tenderId) setActiveTenderId(meta.tenderId);
    setRoute(page);
    setCmdOpen(false);
  };

  const handleAuth = (u) => { setUser(u); setRoute("dashboard"); };
  const handleLogout = () => { if (window.API) API.logout(); setUser(null); setRoute("landing"); };

  if (route === "landing") return <><Landing onEnter={() => setRoute("auth")}/><PageNavToolbar setRoute={setRoute} theme={theme} setTheme={setTheme} user={user} onLogout={handleLogout}/></>;
  if (route === "auth") return <><Auth onEnter={handleAuth}/><PageNavToolbar setRoute={setRoute} theme={theme} setTheme={setTheme} user={user} onLogout={handleLogout}/></>;

  const pages = {
    dashboard:  <Dashboard onNav={navigate} user={user}/>,
    tenders:    <TendersList onNav={navigate}/>,
    upload:     <TenderUpload onNav={navigate}/>,
    analysis:   <TenderAnalysis onNav={navigate} tenderId={activeTenderId}/>,
    chat:       <AIChat onNav={navigate} activeTenderId={activeTenderId}/>,
    builder:    <ProposalBuilder onNav={navigate} activeTenderId={activeTenderId}/>,
    compliance: <CompliancePage onNav={navigate}/>,
    vault:      <DocumentVault onNav={navigate}/>,
    analytics:  <Analytics/>,
    profile:    <CompanyProfile/>,
    pricing:    <Pricing/>,
    admin:      <Admin/>,
  };

  const breadcrumbMap = {
    dashboard: ["Workspace", "Dashboard"],
    tenders: ["Workspace", "Tenders"],
    upload: ["Workspace", "Upload tender"],
    analysis: ["Workspace", "Tenders", "Analysis"],
    chat: ["Workspace", "AI Assistant"],
    builder: ["Proposals", "Proposal Builder"],
    compliance: ["Proposals", "Compliance"],
    vault: ["Proposals", "Document Vault"],
    analytics: ["Insights", "Analytics"],
    profile: ["Insights", "Company Profile"],
    pricing: ["Account", "Pricing"],
    admin: ["Account", "Admin"],
  };

  const fullBleed = ["analysis", "chat", "builder"].includes(route);

  return (
    <>
      <div className="app">
        <Sidebar activePage={route} onNav={navigate}/>
        <div className="main">
          <Topbar
            pageTitle={route}
            breadcrumb={breadcrumbMap[route]}
            onCmd={() => setCmdOpen(true)}
            onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            theme={theme}
            user={user}
            onLogout={handleLogout}
          />
          {fullBleed ? (
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
              {pages[route]}
            </div>
          ) : (
            <div className="main-scroll">
              {pages[route]}
            </div>
          )}
        </div>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNav={navigate}/>
      <PageNavToolbar setRoute={setRoute} theme={theme} setTheme={setTheme} user={user} onLogout={handleLogout}/>
    </>
  );
}

function PageNavToolbar({ setRoute, theme, setTheme, user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 60, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      {open && (
        <div className="card" style={{ padding: 8, boxShadow: "var(--shadow-lg)", minWidth: 200 }}>
          <div style={{ padding: "4px 10px 8px", fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Demo navigation</div>
          {[
            { l: "Landing page", id: "landing" },
            { l: "Login / Register", id: "auth" },
            { l: "Dashboard", id: "dashboard" },
            { l: "Tender Analysis ★", id: "analysis" },
            { l: "AI Chat", id: "chat" },
            { l: "Proposal Builder", id: "builder" },
            { l: "Document Vault", id: "vault" },
            { l: "Compliance", id: "compliance" },
            { l: "Analytics", id: "analytics" },
            { l: "Pricing", id: "pricing" },
            { l: "Admin", id: "admin" },
            { l: "Company Profile", id: "profile" },
          ].map(p => (
            <div key={p.id} className="nav-item" style={{ margin: 0, padding: "6px 10px", fontSize: 12 }}
                 onClick={() => { setRoute(p.id); setOpen(false); }}>
              {p.l}
            </div>
          ))}
          <div className="divider" style={{ margin: "6px 0" }}/>
          {user && (
            <div className="nav-item" style={{ margin: 0, padding: "6px 10px", fontSize: 12, color: "var(--red)" }}
                 onClick={() => { onLogout(); setOpen(false); }}>
              Sign out
            </div>
          )}
          <div className="nav-item" style={{ margin: 0, padding: "6px 10px", fontSize: 12 }}
               onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </div>
        </div>
      )}
      <button className="btn btn-dark" style={{ borderRadius: 999, boxShadow: "var(--shadow-lg)" }} onClick={() => setOpen(!open)}>
        <Icon.command size={13}/> Demo nav
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
