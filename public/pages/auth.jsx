/* ---------- Authentication (Login / Register / Reset) ---------- */
function Auth({ onEnter, mode = "login" }) {
  // Detect a password-reset link: ?reset_token=...
  const resetToken = React.useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("reset_token"); } catch { return null; }
  }, []);

  const [m, setMode] = React.useState(resetToken ? "reset" : mode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);

  const emailRef = React.useRef();
  const passwordRef = React.useRef();
  const firstNameRef = React.useRef();
  const lastNameRef = React.useRef();
  const companyRef = React.useRef();

  const submit = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (!window.API) throw new Error("API client not loaded");
      if (m === "login") {
        const u = await API.login(emailRef.current.value, passwordRef.current.value);
        onEnter(u);
      } else if (m === "register") {
        const full_name = ((firstNameRef.current.value || "") + " " + (lastNameRef.current.value || "")).trim();
        const u = await API.register({
          email: emailRef.current.value,
          password: passwordRef.current.value,
          full_name: full_name || undefined,
          company_name: (companyRef.current && companyRef.current.value) || undefined,
        });
        onEnter(u);
      } else if (m === "forgot") {
        const res = await API.forgotPassword(emailRef.current.value);
        setLoading(false);
        setNotice(res.message || "If an account exists for that email, a reset link has been sent.");
      } else if (m === "reset") {
        const pw = passwordRef.current.value;
        if (!pw || pw.length < 8) { setLoading(false); setError("Password must be at least 8 characters."); return; }
        const res = await API.resetPassword(resetToken, pw);
        setLoading(false);
        setNotice(res.message || "Password updated. You can now sign in.");
        // Clean the token from the URL and switch to login
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
        setMode("login");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg)" }} className="auth-grid">
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
            {m === "login" ? "Welcome back" : m === "register" ? "Create your account" : m === "reset" ? "Choose a new password" : "Reset your password"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>
            {m === "login" ? "Sign in to continue to your workspace."
             : m === "register" ? "Start your 14-day free trial. No card required."
             : m === "reset" ? "Enter a new password for your account."
             : "Enter your email and we'll send you a reset link."}
          </p>

          {error && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12.5, color: "var(--red)" }}>
              {error}
            </div>
          )}
          {notice && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--emerald-soft)", border: "1px solid var(--emerald)", borderRadius: 8, fontSize: 12.5, color: "var(--emerald)" }}>
              {notice}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
            {m === "register" && (
              <div className="grid g-2" style={{ gap: 10 }}>
                <div><label className="label">First name</label><input ref={firstNameRef} className="input" placeholder="First name" onKeyDown={onKey}/></div>
                <div><label className="label">Last name</label><input ref={lastNameRef} className="input" placeholder="Last name" onKeyDown={onKey}/></div>
              </div>
            )}
            {m === "register" && (
              <div><label className="label">Company name</label><input ref={companyRef} className="input" placeholder="Your company (Pty) Ltd" onKeyDown={onKey}/></div>
            )}
            {m !== "reset" && (
              <div>
                <label className="label">Work email</label>
                <input ref={emailRef} className="input" type="email" placeholder={m === "register" ? "you@company.co.za" : "demo@tenderpilot.ai"} onKeyDown={onKey}/>
              </div>
            )}
            {(m !== "forgot") && (
              <div>
                <div className="between" style={{ marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>{m === "reset" ? "New password" : "Password"}</label>
                  {m === "login" && <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: 0 }} onClick={() => { setError(null); setNotice(null); setMode("forgot"); }}>Forgot?</button>}
                </div>
                <input ref={passwordRef} className="input" type="password" placeholder={(m === "register" || m === "reset") ? "Min. 8 characters" : "••••••••"} onKeyDown={onKey}/>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Please wait…" : m === "login" ? "Sign in" : m === "register" ? "Create account" : m === "reset" ? "Update password" : "Send reset link"}
              {!loading && <Icon.arrow size={14}/>}
            </button>

            {(m === "login" || m === "register") && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-3)", fontSize: 11, margin: "4px 0" }}>
                  <div className="divider"/><span>OR</span><div className="divider"/>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", padding: "6px 0", background: "var(--surface-2)", borderRadius: 7, border: "1px solid var(--border)" }}>
                  Demo: <b>demo@tenderpilot.ai</b> / <b>TenderPilot123!</b>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 22, fontSize: 12.5, color: "var(--text-2)", textAlign: "center" }}>
            {m === "login" ? <>Don't have an account? <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => { setError(null); setMode("register"); }}>Start free trial</a></>
             : m === "register" ? <>Already have an account? <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => { setError(null); setMode("login"); }}>Sign in</a></>
             : <a style={{ color: "var(--emerald)", fontWeight: 500, cursor: "pointer" }} onClick={() => { setError(null); setMode("login"); }}>← Back to sign in</a>}
          </div>
        </div>
      </div>

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
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){.auth-grid{grid-template-columns:1fr!important}.auth-right{display:none!important}}`}</style>
    </div>
  );
}

Object.assign(window, { Auth });
