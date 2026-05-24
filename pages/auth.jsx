/* ---------- Authentication (Login / Register) ---------- */
function Auth({ onEnter, mode = "login" }) {
  const [m, setMode] = React.useState(mode);
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg)" }} className="auth-grid">
      {/* Left: form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--navy)", display: "grid", placeItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 14L11 7L15 11L20 6" stroke="var(--emerald-2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="6" r="2" fill="var(--emerald-2)"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, letterSpacing: "-0.012em" }}>TenderPilot<span style={{ color: "var(--emerald)" }}>.ai</span></div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.022em", margin: 0 }}>
            {m === "login" ? "Welcome back" : m === "register" ? "Create your account" : "Reset your password"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>
            {m === "login" ? "Sign in to continue to your workspace."
             : m === "register" ? "Start your 14-day free trial. No card required."
             : "Enter your email and we'll send you a reset link."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
            {m === "register" && (
              <div className="grid g-2" style={{ gap: 10 }}>
                <div><label className="label">First name</label><input className="input" defaultValue="Lerato"/></div>
                <div><label className="label">Last name</label><input className="input" defaultValue="Mokoena"/></div>
              </div>
            )}
            {m === "register" && (
              <div><label className="label">Company name</label><input className="input" defaultValue="Sandile Cybersecurity (Pty) Ltd"/></div>
            )}
            <div>
              <label className="label">Work email</label>
              <input className="input" type="email" defaultValue="lerato@sandilecyber.co.za"/>
            </div>
            {m !== "forgot" && (
              <div>
                <div className="between" style={{ marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Password</label>
                  {m === "login" && <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: 0 }} onClick={() => setMode("forgot")}>Forgot?</button>}
                </div>
                <input className="input" type="password" defaultValue="••••••••••••"/>
              </div>
            )}
            <button className="btn btn-primary btn-lg" style={{ justifyContent: "center", marginTop: 4 }} onClick={onEnter}>
              {m === "login" ? "Sign in" : m === "register" ? "Create account" : "Send reset link"}
              <Icon.arrow size={14}/>
            </button>

            {m !== "forgot" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-3)", fontSize: 11, margin: "4px 0" }}>
                  <div className="divider"/><span>OR</span><div className="divider"/>
                </div>
                <button className="btn btn-lg" style={{ justifyContent: "center" }} onClick={onEnter}>
                  <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18A13.96 13.96 0 0 1 11 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A22 22 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.13 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7C13.42 14.62 18.27 10.75 24 10.75z"/></svg>
                  Continue with Google
                </button>
                <button className="btn btn-lg" style={{ justifyContent: "center" }} onClick={onEnter}>
                  <Icon.fingerprint size={14}/>
                  Continue with Microsoft 365
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 22, fontSize: 12.5, color: "var(--text-2)", textAlign: "center" }}>
            {m === "login" ? <>Don't have an account? <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => setMode("register")}>Start free trial</a></>
             : m === "register" ? <>Already have an account? <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => setMode("login")}>Sign in</a></>
             : <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => setMode("login")}>← Back to sign in</a>}
          </div>

          {m === "register" && (
            <div style={{ marginTop: 18, padding: 12, background: "var(--surface-2)", borderRadius: 8, fontSize: 11, color: "var(--text-3)" }}>
              By signing up you agree to the Terms of Service and POPIA-compliant Privacy Policy. Hosted in ZA · AWS Cape Town.
            </div>
          )}
        </div>
      </div>

      {/* Right: showcase */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy), #16273F 50%, var(--navy-2))",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
      }} className="auth-right">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 400px at 80% 10%, rgba(16,185,129,.22), transparent 60%), radial-gradient(500px 300px at 20% 90%, rgba(96,165,250,.16), transparent 60%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", maxWidth: 480, color: "white" }}>
          <div className="chip" style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.85)", border: "1px solid rgba(255,255,255,.14)", marginBottom: 22 }}>
            <Icon.sparkles size={11}/>Now generating SBD forms automatically
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, color: "white" }}>
            "We doubled our submission rate without hiring. The compliance matrix alone paid for the year."
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
            <Avatar name="Sipho Ndlovu"/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Sipho Ndlovu</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>MD, NorthOps Engineering</div>
            </div>
          </div>

          <div style={{ marginTop: 50, padding: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--emerald-2)" }} className="pulse-dot"/>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", fontFamily: "var(--font-mono)" }}>RFB 2025/IT/0142 · analyzing</div>
            </div>
            <div style={{ fontSize: 14, color: "white", fontWeight: 600, marginBottom: 8 }}>SARS Cybersecurity Infrastructure</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16 }}>
              <Ring value={86} size={60} stroke={6}/>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".08em" }}>Bid readiness</div>
                <div style={{ fontSize: 14, color: "white", fontWeight: 500, marginTop: 4 }}>Strong match · ready to bid</div>
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "rgba(16,185,129,.18)", color: "var(--emerald-2)", border: "1px solid rgba(16,185,129,.3)" }}>7 of 10 mandatory met</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "rgba(245,158,11,.16)", color: "#FCD34D", border: "1px solid rgba(245,158,11,.3)" }}>2 caution items</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "rgba(96,165,250,.14)", color: "#93C5FD", border: "1px solid rgba(96,165,250,.3)" }}>19 days to close</span>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: -30, left: -20, fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "var(--font-mono)" }}>
            v2.4 · all systems operational
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px){.auth-grid{grid-template-columns:1fr!important}.auth-right{display:none!important}}`}</style>
    </div>
  );
}

Object.assign(window, { Auth });
