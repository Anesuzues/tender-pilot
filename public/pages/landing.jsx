/* ---------- Landing Page ---------- */
// Illustrative sample shown only on the public marketing page (never in the app).
const LANDING_PREVIEW = [
  { id: "RFB 2025/IT/0142", title: "Cybersecurity infrastructure", score: 86 },
  { id: "ESKOM/RFQ/2026/0337", title: "SCADA systems maintenance", score: 78 },
  { id: "MUN/JHB/SEC/2026/008", title: "Physical security services", score: 72 },
];

function Landing({ onEnter }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflowY: "auto" }}>
      {/* Top nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5,
        background: "color-mix(in oklab, var(--bg) 80%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, background: "var(--navy)",
              display: "grid", placeItems: "center"
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 14L11 7L15 11L20 6" stroke="var(--emerald-2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="6" r="2" fill="var(--emerald-2)"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, letterSpacing: "-0.012em" }}>TenderPilot<span style={{ color: "var(--emerald)" }}>.ai</span></div>
          </div>
          <nav style={{ display: "flex", gap: 22, marginLeft: 24, fontSize: 13, color: "var(--text-2)" }} className="lp-nav">
            <a>Product</a><a>Compliance</a><a>For Government</a><a>Pricing</a><a>Resources</a>
          </nav>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm" onClick={onEnter}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={onEnter}>Start free trial<Icon.arrow size={13}/></button>
        </div>
      </div>

      {/* Hero */}
      <section className="hero-grad" style={{ padding: "72px 24px 56px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="chip emerald" style={{ marginBottom: 22 }}>
            <Icon.sparkles size={11}/> New · AI-drafted SBD 4 & 6.1 forms
          </div>
          <h1 style={{
            fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 600, letterSpacing: "-0.034em",
            lineHeight: 1.02, margin: 0, maxWidth: 980, textWrap: "balance",
          }}>
            Turn complex tenders into{" "}
            <span style={{
              background: "linear-gradient(120deg, var(--emerald), #0E9F6E)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>winning proposals</span>{" "}
            <span style={{ color: "var(--text-3)", fontWeight: 500 }}>— in hours, not weeks.</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-2)", marginTop: 22, maxWidth: 680, lineHeight: 1.55 }}>
            TenderPilot reads RFPs, RFBs and RFQs, scores your bid readiness, surfaces compliance gaps, and drafts
            submission-ready proposals — purpose-built for South African SMEs bidding on government and SOE work.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={onEnter}>
              Try the live demo <Icon.arrow size={14}/>
            </button>
            <button className="btn btn-lg" onClick={onEnter}>
              <Icon.bolt size={14}/> Watch 2-min tour
            </button>
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 18, color: "var(--text-3)", fontSize: 12.5, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon.check size={12} style={{ color: "var(--emerald)" }}/>POPIA compliant</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon.check size={12} style={{ color: "var(--emerald)" }}/>14-day free trial</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon.check size={12} style={{ color: "var(--emerald)" }}/>No card required</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon.check size={12} style={{ color: "var(--emerald)" }}/>Hosted in ZA · AWS Cape Town</span>
          </div>

          {/* Dashboard mock */}
          <div style={{ marginTop: 56, position: "relative" }}>
            <DashboardPreview/>
            <FloatingBadge top="14%" left="-3%" delay={0}>
              <Icon.shield size={13} style={{ color: "var(--emerald)" }}/>
              <span><b>B-BBEE Level 2</b> verified</span>
            </FloatingBadge>
            <FloatingBadge top="58%" right="-2%" delay={.2}>
              <Icon.sparkles size={13} style={{ color: "var(--blue)" }}/>
              <span>AI matched <b>14 tenders</b> this week</span>
            </FloatingBadge>
            <FloatingBadge bottom="-4%" left="32%" delay={.4}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--emerald)" }} className="pulse-dot"/>
              <span>Bid readiness <b className="mono">86%</b></span>
            </FloatingBadge>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section style={{ padding: "44px 24px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 22 }}>
            Trusted by 480+ SMEs bidding on
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", gap: 28, flexWrap: "wrap", color: "var(--text-3)", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>
            <span>SARS</span><span>Transnet</span><span>Eskom</span><span>City of Cape Town</span>
            <span>DPWI</span><span>SAPS</span><span>National Treasury</span>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section style={{ padding: "84px 24px 30px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Eyebrow>Platform</Eyebrow>
          <h2 style={H2}>Everything you need from <i style={{ fontStyle: "normal", color: "var(--text-3)" }}>"published"</i> to <i style={{ fontStyle: "normal", color: "var(--emerald)" }}>submitted</i>.</h2>
          <p style={Sub}>Six modules that automate the unglamorous 80% of bidding so your team can focus on what wins.</p>
          <div className="grid g-3" style={{ marginTop: 36, gap: 14 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f}/>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "84px 24px 30px", background: "var(--bg-elev)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Eyebrow>How it works</Eyebrow>
          <h2 style={H2}>From RFB to ready-to-submit in <span className="mono">4</span> steps.</h2>
          <div className="grid g-4" style={{ marginTop: 36 }}>
            {HOW.map((h, i) => (
              <div key={i} className="card card-pad">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: "var(--surface-2)",
                    border: "1px solid var(--border)", display: "grid", placeItems: "center",
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--emerald)", fontWeight: 600,
                  }}>0{i+1}</div>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.012em" }}>{h.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>{h.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SA compliance */}
      <section style={{ padding: "84px 24px 30px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }} className="lp-cols">
          <div>
            <Eyebrow style={{ color: "var(--emerald)" }}>South African compliance</Eyebrow>
            <h2 style={H2}>Built for the SBD form. Trained on the PPPFA.</h2>
            <p style={Sub}>
              We've encoded the National Treasury supply chain instructions, the latest PPPFA preference point
              system, and the BEE Codes — so every check that matters happens automatically.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              {SA_COMPLIANCE.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{
                    width: 28, height: 28, flexShrink: 0, borderRadius: 7,
                    background: "var(--emerald-soft)", color: "var(--emerald)",
                    display: "grid", placeItems: "center"
                  }}><Icon.check size={14}/></div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ChatPreview/>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="grid g-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card card-pad">
                <div style={{ display: "flex", gap: 1, marginBottom: 14 }}>
                  {[0,1,2,3,4].map(s => <Icon.star key={s} size={13} fill="var(--amber)" sw={0} />)}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", textWrap: "pretty" }}>{t.quote}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <Avatar name={t.name}/>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center", marginBottom: 36 }}>
          <Eyebrow>Pricing</Eyebrow>
          <h2 style={H2}>Plans that scale with your bid volume.</h2>
        </div>
        <div className="grid g-4" style={{ maxWidth: 1240, margin: "0 auto" }}>
          {PRICING_PREVIEW.map((p, i) => (
            <div key={i} className={cx("card card-pad")} style={{
              borderColor: p.highlight ? "var(--emerald)" : "var(--border)",
              boxShadow: p.highlight ? "var(--shadow-glow)" : "var(--shadow-sm)",
              position: "relative"
            }}>
              {p.highlight && (
                <span className="chip emerald" style={{ position: "absolute", top: 16, right: 16 }}>Most popular</span>
              )}
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 10 }}>
                R{p.price}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-3)" }}>/month</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{p.tagline}</div>
              <button className={cx("btn", p.highlight ? "btn-primary" : "")} style={{ width: "100%", justifyContent: "center", marginTop: 18 }} onClick={onEnter}>
                Choose {p.name}
              </button>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {p.features.map((f, fi) => (
                  <div key={fi} style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)" }}>
                    <Icon.check size={12} style={{ color: "var(--emerald)" }}/>{f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "60px 48px",
          background: "linear-gradient(135deg, var(--navy), #16273F 70%, var(--navy))",
          borderRadius: 24, color: "white", overflow: "hidden", position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(600px 300px at 90% 0%, rgba(16,185,129,.22), transparent 60%)", pointerEvents: "none" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap", position: "relative" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.1 }}>
                Win the next tender.<br/>
                <span style={{ color: "var(--emerald-2)" }}>Start tonight.</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,.7)", marginTop: 14, fontSize: 14.5, maxWidth: 520 }}>
                Upload your first RFP. Get a bid-readiness score, missing-document list, and an AI-drafted executive summary in under 4 minutes.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-lg" style={{ background: "white", color: "var(--navy)", borderColor: "white" }} onClick={onEnter}>
                Try the demo <Icon.arrow size={14}/>
              </button>
              <button className="btn btn-lg" style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,.3)" }}
                      onClick={() => { window.location.href = "mailto:hello@tenderpilot.ai?subject=Book%20a%20TenderPilot%20walkthrough"; }}>
                Book a walkthrough
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 24px 30px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600 }}>TenderPilot<span style={{ color: "var(--emerald)" }}>.ai</span></div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
              Made in Cape Town · Hosted in ZA · POPIA registered
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 12.5, color: "var(--text-2)" }}>
            <div className="col gap-2"><b style={{ color: "var(--text)", fontWeight: 500 }}>Product</b><a>Dashboard</a><a>AI assistant</a><a>Document vault</a></div>
            <div className="col gap-2"><b style={{ color: "var(--text)", fontWeight: 500 }}>Company</b><a>About</a><a>Careers</a><a>Press</a></div>
            <div className="col gap-2"><b style={{ color: "var(--text)", fontWeight: 500 }}>Legal</b><a>Privacy</a><a>POPIA</a><a>Terms</a></div>
          </div>
        </div>
        <div style={{ maxWidth: 1240, margin: "30px auto 0", paddingTop: 18, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-3)", display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 TenderPilot AI (Pty) Ltd · Reg. 2025/118402/07</span>
          <span>v2.4 · status: <span style={{ color: "var(--emerald)" }}>● all systems operational</span></span>
        </div>
      </footer>
    </div>
  );
}

const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: 11.5, color: "var(--emerald)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12, ...style }}>{children}</div>
);
const H2 = { fontSize: "clamp(28px, 3.6vw, 42px)", fontWeight: 600, letterSpacing: "-0.026em", margin: 0, lineHeight: 1.08, maxWidth: 820, textWrap: "balance" };
const Sub = { fontSize: 15, color: "var(--text-2)", marginTop: 14, maxWidth: 620, lineHeight: 1.55 };

const FEATURES = [
  { icon: "scan", title: "AI tender parsing", body: "OCR + LLM extracts mandatory requirements, deadlines, evaluation criteria and citation page references from any RFP.", tag: "Core" },
  { icon: "shield", title: "Compliance autopilot", body: "Cross-references your vault against tender requirements, flags expired docs, drafts missing SBD forms.", tag: "Most-loved" },
  { icon: "score", title: "Bid-readiness score", body: "Real-time match probability rooted in evaluation weights, historical wins, and your B-BBEE level.", tag: "AI" },
  { icon: "edit", title: "Proposal builder", body: "Section-aware writing assistant. Generate executive summaries, methodology, pricing notes — keep tone of voice.", tag: "AI" },
  { icon: "vault", title: "Document vault", body: "Versioned compliance store with expiry alerts and one-click attach. CSD, Tax PIN, B-BBEE, COID — all in one place.", tag: "" },
  { icon: "chart", title: "Pipeline analytics", body: "Win-rate by issuer, average bid size, response time. Export-ready dashboards for board reporting.", tag: "" },
];

function FeatureCard({ icon, title, body, tag }) {
  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 200, transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: "var(--surface-2)",
          border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--emerald)"
        }}>{Icon[icon] && Icon[icon]({ size: 17 })}</div>
        {tag && <span className="chip">{tag}</span>}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.014em" }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, textWrap: "pretty" }}>{body}</div>
    </div>
  );
}

const HOW = [
  { title: "Drop the RFP", body: "PDF, DOCX or zip. We OCR scanned pages and pull tables out of native PDFs." },
  { title: "AI reads it", body: "Requirements, mandatory documents, evaluation criteria and submission rules — extracted with page citations." },
  { title: "Score & gap-check", body: "Bid readiness score, compliance heatmap, missing-document checklist generated against your vault." },
  { title: "Draft & submit", body: "AI drafts executive summary, methodology and SBD forms. You review, sign and submit." },
];

const SA_COMPLIANCE = [
  { t: "PPPFA 2022 preference point engine", d: "Calculates your 90/10 or 80/20 split given the tender threshold and your B-BBEE level." },
  { t: "Generic & QSE codes", d: "We know when an affidavit is sufficient vs when a verification certificate is mandatory." },
  { t: "Mandatory SBD forms 1–9", d: "Pre-fills SBD 4, 6.1, 8, 9 from your profile. Flags directors needing tax PINs." },
  { t: "CSD live-check", d: "Surfaces stale CSD information, expired tax PINs, and CIPC anomalies before you submit." },
  { t: "POPIA-compliant", d: "All documents encrypted at rest in AWS Cape Town. SOC 2 Type II audit underway." },
];

const TESTIMONIALS = [
  { name: "Sipho Ndlovu", role: "MD, NorthOps Engineering", quote: "We doubled our submission rate without hiring. The compliance matrix alone has paid for the year — we caught three expiring CIDB letters in the first week." },
  { name: "Thandi Khumalo", role: "Head of Bids, Mzansi ICT", quote: "It feels less like a tool and more like an analyst that never sleeps. The eligibility check is shockingly good — even on poorly scanned RFBs." },
  { name: "Pieter van der Merwe", role: "CEO, Cape Cleaning Co.", quote: "I used to spend Saturdays formatting bids. Now I review what the AI drafted, fix three paragraphs, and submit. Our win rate jumped from 11% to 23%." },
];

const PRICING_PREVIEW = [
  { name: "Starter", price: "490", tagline: "1 user · 5 tenders/mo", features: ["AI parsing", "Compliance vault", "Email alerts"], highlight: false },
  { name: "Professional", price: "1,490", tagline: "3 users · 25 tenders/mo", features: ["Everything in Starter", "Proposal builder", "Win-rate analytics", "Priority OCR"], highlight: true },
  { name: "Agency", price: "3,990", tagline: "10 users · unlimited tenders", features: ["Multi-company workspaces", "White-label exports", "Dedicated CSM"], highlight: false },
  { name: "Enterprise", price: "—", tagline: "Custom · SLA + on-prem", features: ["SSO / SAML", "Air-gapped option", "Custom AI fine-tuning"], highlight: false },
];

/* ---------- Dashboard preview (rendered inside hero) ---------- */
function DashboardPreview() {
  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      border: "1px solid var(--border-strong)",
      background: "var(--bg-elev)",
      boxShadow: "0 60px 120px -40px rgba(8,12,15,.32), 0 30px 60px -30px rgba(4,120,87,.18)"
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)", gap: 8, background: "var(--surface)" }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FF5F57" }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FEBC2E" }}/>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#28C840" }}/>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          app.tenderpilot.ai / dashboard
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 460, background: "var(--bg)" }}>
        <div style={{ borderRight: "1px solid var(--border)", padding: 12, background: "var(--bg-elev)" }}>
          <div className="chip" style={{ marginBottom: 14 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--emerald)" }}/>Workspace</div>
          {["Dashboard","Tenders","AI Assistant","Vault","Proposals","Analytics"].map((l, i) => (
            <div key={l} style={{ padding: "7px 9px", borderRadius: 6, fontSize: 12, color: i===0 ? "var(--text)" : "var(--text-2)", background: i===0 ? "var(--surface)" : "transparent", marginBottom: 2, border: i===0 ? "1px solid var(--border)" : "1px solid transparent" }}>{l}</div>
          ))}
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
            {[
              {l:"Active tenders", v:"14", d:"+3"},
              {l:"Bid readiness", v:"86%", d:"+9"},
              {l:"Missing docs", v:"3", d:"-2"},
            ].map((k, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.l}</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.022em", marginTop: 4 }}>{k.v}</div>
                <div style={{ fontSize: 10.5, color: "var(--emerald)", marginTop: 4 }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon.sparkles size={13} style={{ color: "var(--emerald)" }}/>
              <div style={{ fontSize: 12, fontWeight: 600 }}>AI insight</div>
              <span className="chip blue" style={{ marginLeft: "auto" }}>new</span>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-2)" }}>
              <b style={{ color: "var(--text)" }}>SARS Cybersecurity RFB</b> matches your profile at <b className="mono">86%</b>. Two of three required references are missing. Closing in <b className="mono">19 days</b>.
            </div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Example analysis</div>
            {LANDING_PREVIEW.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border)", gap: 10, fontSize: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{t.title}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{t.id}</div>
                </div>
                <span className="mono" style={{ fontSize: 11 }}>{t.score}%</span>
                <span style={{ display: "inline-block", width: 60, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: `${t.score}%`, background: t.score>=80?"var(--emerald)":t.score>=60?"var(--amber)":"var(--red)" }}/>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingBadge({ children, top, bottom, left, right, delay = 0 }) {
  return (
    <div style={{
      position: "absolute", top, bottom, left, right,
      background: "var(--surface)", border: "1px solid var(--border-strong)",
      borderRadius: 999, padding: "8px 14px", boxShadow: "var(--shadow-lg)",
      display: "inline-flex", alignItems: "center", gap: 8,
      fontSize: 12, fontWeight: 500,
      animation: `fade-in-up .8s ${delay}s ease both`,
    }}>
      {children}
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon.sparkles size={14} style={{ color: "var(--emerald)" }}/>
        <span style={{ fontSize: 13, fontWeight: 600 }}>TenderPilot AI</span>
        <span className="chip" style={{ marginLeft: "auto", fontSize: 10 }}>Live preview</span>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, background: "var(--bg)" }}>
        <Bubble who="user">What disqualifies us from RFB 2025/IT/0142?</Bubble>
        <Bubble who="ai">
          <div>Three potential disqualifiers based on Section 3 of the RFB:</div>
          <ol style={{ paddingLeft: 18, margin: "10px 0 4px", lineHeight: 1.55 }}>
            <li>You have <b>1 of 3</b> required revenue-authority references <span className="chip red" style={{ fontSize: 10, marginLeft: 6 }}>fail</span></li>
            <li>Your CrowdStrike Falcon cert is <b>pending renewal</b> <span className="chip amber" style={{ fontSize: 10, marginLeft: 6 }}>warn</span></li>
            <li>SBD 4 declaration <b>missing</b> from your vault <span className="chip red" style={{ fontSize: 10, marginLeft: 6 }}>fail</span></li>
          </ol>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span className="chip"><Icon.doc size={10}/>Section 3.7, p. 18</span>
            <span className="chip"><Icon.doc size={10}/>Section 3.8, p. 19</span>
          </div>
        </Bubble>
      </div>
    </div>
  );
}

function Bubble({ who, children }) {
  const isUser = who === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "80%",
        background: isUser ? "var(--navy)" : "var(--surface)",
        color: isUser ? "white" : "var(--text)",
        border: isUser ? "1px solid var(--navy)" : "1px solid var(--border)",
        padding: "10px 14px", borderRadius: 12,
        fontSize: 13, lineHeight: 1.55,
      }}>{children}</div>
    </div>
  );
}

Object.assign(window, { Landing });
