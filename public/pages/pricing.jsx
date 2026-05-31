/* ---------- Pricing ---------- */
function Pricing({ onNav }) {
  const [yearly, setYearly] = React.useState(true);
  const goSignup = () => {
    if (window.API && API.isLoggedIn()) { window.toast && toast("You're already signed in — manage billing from Admin."); }
    else if (onNav) onNav("auth");
  };

  const plans = [
    {
      name: "Starter", price: yearly ? 390 : 490, tagline: "For sole proprietors testing the waters",
      features: ["1 user seat", "5 tenders analyzed / mo", "Compliance vault (15 docs)", "Email alerts", "Community support"],
      cta: "Start free trial", highlight: false,
    },
    {
      name: "Professional", price: yearly ? 1190 : 1490, tagline: "Most SMEs choose this — covers a typical bid team",
      features: ["3 user seats", "25 tenders / mo", "Unlimited vault", "AI proposal builder", "Priority OCR + chat", "Win-rate analytics"],
      cta: "Start free trial", highlight: true,
    },
    {
      name: "Agency", price: yearly ? 3190 : 3990, tagline: "For consultancies bidding on behalf of multiple clients",
      features: ["10 user seats", "Unlimited tenders", "Multi-company workspaces", "White-label PDF exports", "Dedicated CSM", "API access"],
      cta: "Talk to sales", highlight: false,
    },
    {
      name: "Enterprise", price: "Custom", tagline: "Large bid teams · custom procurement workflows",
      features: ["Unlimited everything", "SSO / SAML 2.0", "Custom AI fine-tuning", "On-prem option", "SLA-backed", "Procurement integration"],
      cta: "Contact sales", highlight: false,
    },
  ];

  const compare = [
    { row: "Tenders parsed per month", v: ["5", "25", "Unlimited", "Unlimited"] },
    { row: "User seats", v: ["1", "3", "10", "Custom"] },
    { row: "Document vault size", v: ["15 docs", "Unlimited", "Unlimited", "Unlimited"] },
    { row: "AI proposal drafting", v: ["—", "✓", "✓", "✓"] },
    { row: "Compliance auto-fill", v: ["✓", "✓", "✓", "✓"] },
    { row: "Win-rate analytics", v: ["—", "✓", "✓", "✓"] },
    { row: "Multi-workspace", v: ["—", "—", "✓", "✓"] },
    { row: "White-label exports", v: ["—", "—", "✓", "✓"] },
    { row: "API access", v: ["—", "—", "✓", "✓"] },
    { row: "SSO / SAML", v: ["—", "—", "—", "✓"] },
    { row: "Dedicated CSM", v: ["—", "—", "✓", "✓"] },
    { row: "SLA & 24/7 support", v: ["—", "—", "—", "✓"] },
  ];

  return (
    <div className="page">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="chip emerald" style={{ marginBottom: 14 }}><Icon.sparkles size={11}/>14-day free trial · no card required</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.026em", margin: 0, lineHeight: 1.08 }}>
          Pricing that pays for itself on your <span style={{ color: "var(--emerald)" }}>first won bid.</span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 580, margin: "14px auto 0", lineHeight: 1.55 }}>
          ZAR-denominated. VAT inclusive. Cancel any time. Scale up or down month-to-month.
        </p>

        {/* Monthly/yearly toggle */}
        <div style={{ display: "inline-flex", marginTop: 24, padding: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, boxShadow: "var(--shadow-xs)" }}>
          <button onClick={() => setYearly(false)} className={cx("btn btn-sm", !yearly ? "btn-dark" : "btn-ghost")} style={{ borderRadius: 999 }}>Monthly</button>
          <button onClick={() => setYearly(true)} className={cx("btn btn-sm", yearly ? "btn-dark" : "btn-ghost")} style={{ borderRadius: 999 }}>
            Yearly <span className="chip emerald" style={{ marginLeft: 4, fontSize: 9.5, padding: "1px 5px" }}>Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 40 }}>
        {plans.map((p, i) => (
          <div key={i} className="card card-pad" style={{
            position: "relative", display: "flex", flexDirection: "column", gap: 14,
            borderColor: p.highlight ? "var(--emerald)" : "var(--border)",
            boxShadow: p.highlight ? "var(--shadow-glow)" : "var(--shadow-sm)",
            background: p.highlight ? "linear-gradient(180deg, color-mix(in oklab, var(--emerald-soft), var(--surface) 88%), var(--surface) 60%)" : "var(--surface)",
          }}>
            {p.highlight && <span className="chip emerald" style={{ position: "absolute", top: -10, left: 18, background: "var(--emerald)", color: "white", borderColor: "var(--emerald)" }}>Most popular</span>}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 4, minHeight: 28 }}>{p.tagline}</div>
            </div>
            <div>
              {typeof p.price === "number" ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>R</span>
                  <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.026em" }} className="tnum">{p.price.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>/{yearly ? "mo · billed annually" : "mo"}</span>
                </div>
              ) : (
                <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em" }}>{p.price}</div>
              )}
            </div>
            <button className={cx("btn", p.highlight ? "btn-primary" : "btn-dark")} style={{ justifyContent: "center" }} onClick={goSignup}>
              {p.cta}<Icon.arrow size={13}/>
            </button>
            <div className="divider"/>
            <div className="col gap-2">
              {p.features.map((f, fi) => (
                <div key={fi} style={{ fontSize: 12.5, display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-2)" }}>
                  <Icon.check size={12} style={{ color: "var(--emerald)", marginTop: 3, flexShrink: 0 }}/>{f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="card" style={{ padding: 0, marginBottom: 32, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Compare plans</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>What's included in each tier</div>
        </div>
        <div className="scrollx">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Feature</th>
                {plans.map(p => <th key={p.name}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {compare.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12.5, color: "var(--text-2)" }}>{r.row}</td>
                  {r.v.map((v, ci) => (
                    <td key={ci} style={{ fontSize: 13, fontWeight: v === "✓" ? 600 : 400, color: v === "✓" ? "var(--emerald)" : v === "—" ? "var(--text-3)" : "var(--text)" }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.022em", margin: 0 }}>Frequently asked</h2>
        </div>
        <div className="col gap-2">
          {[
            { q: "Do you charge per tender?", a: "No. Your plan includes a monthly tender allowance. Unused tenders don't roll over but you can upgrade or top up mid-month." },
            { q: "Is my data hosted in South Africa?", a: "Yes — all customer data is hosted in AWS Cape Town. We're POPIA-registered and currently in SOC 2 Type II audit." },
            { q: "Can I cancel any time?", a: "Yes. Monthly plans cancel at the end of the billing cycle. Annual plans are pro-rated and refunded for unused months." },
            { q: "Do you offer NPO / non-profit pricing?", a: "Yes — registered NPOs and PBOs receive 50% off Professional and Agency tiers. Email hello@tenderpilot.ai with proof of registration." },
            { q: "What if my preferred LLM changes?", a: "Enterprise plans can pin a specific model and version. Default tiers use the best general model for South African government bid analysis." },
          ].map((f, i) => <FAQItem key={i} {...f}/>)}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card" style={{ padding: 0, cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{q}</div>
        <Icon.chevDown size={13} style={{ color: "var(--text-3)", transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}/>
      </div>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, textWrap: "pretty" }}>{a}</div>
      )}
    </div>
  );
}

Object.assign(window, { Pricing });
