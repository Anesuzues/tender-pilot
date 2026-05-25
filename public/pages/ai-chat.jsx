/* ---------- AI Chat ---------- */
function AIChat({ onNav, activeTenderId }) {
  const [messages, setMessages] = React.useState([
    { who: "ai", text: "I've finished parsing **RFB 2025/IT/0142** (SARS Cybersecurity). What would you like to know?", sources: [] },
  ]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(null);
  const [sessions, setSessions] = React.useState(CHAT_HISTORY);
  const scrollRef = React.useRef(null);

  // Create or load a chat session
  React.useEffect(() => {
    if (!window.API || !API.isLoggedIn()) return;
    const init = async () => {
      try {
        const sess = await API.createChatSession(activeTenderId || null);
        setSessionId(sess.id);
      } catch (e) { /* fall back to mock */ }
      try {
        const list = await API.getChatSessions();
        const items = list.items || list;
        if (items.length) {
          setSessions(items.map((s, i) => ({ id: s.id, title: s.title || "Chat session", date: i === 0 ? "Today" : "Earlier", active: i === 0 })));
        }
      } catch (e) {}
    };
    init();
  }, [activeTenderId]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(m => [...m, { who: "user", text: q }]);
    setInput("");
    setTyping(true);

    if (window.API && API.isLoggedIn() && sessionId) {
      try {
        const res = await API.sendMessage(sessionId, q);
        setTyping(false);
        setMessages(m => [...m, {
          who: "ai",
          text: res.answer,
          sources: (res.citations || []).map(c => ({ p: c.page, sec: c.section, snippet: c.snippet })),
        }]);
        return;
      } catch (e) { /* fall through to mock */ }
    }

    // Mock fallback
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, mockReply(q)]);
    }, 1400);
  };

  const contextTender = TENDERS[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", flex: 1, minHeight: 0 }} className="chat-grid">
      {/* Session list */}
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto", display: "flex", flexDirection: "column" }} className="chat-history">
        <div style={{ padding: "14px 14px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Conversations</div>
          <button className="btn btn-sm btn-ghost btn-icon" style={{ marginLeft: "auto" }}><Icon.plus size={12}/></button>
        </div>
        <div style={{ padding: "0 8px", flex: 1, overflowY: "auto" }}>
          {Object.entries(groupBy(sessions, "date")).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", padding: "10px 8px 4px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{date}</div>
              {items.map(c => (
                <div key={c.id} className={cx("nav-item", c.active && "active")} style={{ fontSize: 12.5, margin: 0, padding: "7px 8px", borderRadius: 6 }}>
                  <Icon.spark size={12} style={{ flexShrink: 0, color: c.active ? "var(--emerald)" : "var(--text-3)" }}/>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat thread */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--bg-elev)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>SARS Cybersecurity — eligibility</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Context: RFB 2025/IT/0142 · {messages.length} messages{sessionId ? " · live" : " · demo mode"}</div>
          </div>
          <span className="chip"><Icon.fingerprint size={10}/>POPIA encrypted</span>
          <button className="btn btn-sm btn-ghost"><Icon.copy size={12}/></button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            {messages.map((m, i) => <MessageBubble key={i} m={m}/>)}
            {typing && (
              <div style={{ display: "flex", gap: 12 }}>
                <AIAvatar/>
                <div className="card card-pad-sm" style={{ padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <TypingDots/>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Analyzing…</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-elev)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {["What disqualifies this bid?", "Summarize the pricing requirements", "Generate an executive summary", "What mandatory requirements are we missing?"].map((s, i) => (
                <Suggestion key={i} onClick={() => send(s)}>{s}</Suggestion>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border-strong)", borderRadius: 12, background: "var(--surface)", padding: "10px 12px", boxShadow: "var(--shadow-sm)" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask TenderPilot anything about this tender…"
                rows={1}
                style={{ flex: 1, border: 0, outline: "none", background: "transparent", fontSize: 14, resize: "none", lineHeight: 1.5, color: "var(--text)", fontFamily: "inherit" }}
              />
              <button className="btn btn-primary btn-sm" onClick={() => send()} disabled={!input.trim() || typing} style={{ opacity: (input.trim() && !typing) ? 1 : 0.4 }}>
                <Icon.send size={12}/>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontSize: 10.5, color: "var(--text-3)" }}>
              <span>TenderPilot can make mistakes. Verify mandatory items with source PDF.</span>
              <span><Icon.cpu size={10}/> {sessionId ? "Live · connected" : "Demo mode"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Context panel */}
      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-elev)", overflowY: "auto", padding: 14 }} className="chat-context">
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 12 }}>Active context</div>
        <ContextCard t={contextTender} onNav={onNav}/>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, margin: "20px 0 10px" }}>Linked vault docs</div>
        {COMPLIANCE_DOCS.slice(0,4).map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
            <div style={{ width: 24, height: 28, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon.doc size={11} style={{ color: "var(--text-3)" }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{d.category}</div>
            </div>
            <StatusChip status={d.status}/>
          </div>
        ))}
      </aside>

      <style>{`.chat-grid{height:100%}@media(max-width:1180px){.chat-grid{grid-template-columns:1fr!important}.chat-history,.chat-context{display:none!important}}`}</style>
    </div>
  );
}

function AIAvatar() {
  return (
    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, var(--emerald), var(--navy))", display: "grid", placeItems: "center", color: "white" }}>
      <Icon.sparkles size={14}/>
    </div>
  );
}

function MessageBubble({ m }) {
  if (m.who === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <div style={{ background: "var(--navy)", color: "white", padding: "10px 14px", borderRadius: 12, fontSize: 13.5, maxWidth: 520, lineHeight: 1.55 }}>{m.text}</div>
        <Avatar name="You"/>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <AIAvatar/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>TenderPilot</span>
          {m.sources && m.sources.length > 0 && <span className="chip blue" style={{ fontSize: 10 }}>{m.sources.length} source{m.sources.length !== 1 ? "s" : ""}</span>}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--text)", textWrap: "pretty" }}
             dangerouslySetInnerHTML={{ __html: (m.text || "").replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }}/>
        {m.bullets && (
          <div className="col gap-2" style={{ marginTop: 12 }}>
            {m.bullets.map((b, i) => (
              <div key={i} className="card card-pad-sm" style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: b.sev === "fail" ? "var(--red-soft)" : "var(--amber-soft)", color: b.sev === "fail" ? "var(--red)" : "var(--amber)", display: "grid", placeItems: "center" }}>
                  {b.sev === "fail" ? <Icon.x size={11}/> : <Icon.alert size={11}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5 }}>{b.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {m.sources && m.sources.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {m.sources.filter(s => s.p).map((s, i) => (
              <span key={i} className="chip"><Icon.doc size={10}/>{s.sec ? "§" + s.sec + " · " : ""}p.{s.p}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          <button className="btn btn-sm btn-ghost btn-icon"><Icon.copy size={12}/></button>
          <button className="btn btn-sm btn-ghost btn-icon"><Icon.refresh size={12}/></button>
        </div>
      </div>
    </div>
  );
}

function ContextCard({ t, onNav }) {
  return (
    <div className="card card-pad-sm" style={{ cursor: "pointer" }} onClick={() => onNav("analysis")}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{t.id}</span>
        <span className="chip emerald" style={{ marginLeft: "auto", fontSize: 10 }}>{t.score}%</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{t.title}</div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{t.issuer}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <span className="chip"><Icon.clock size={10}/>{t.closingDays}d</span>
        <span className="chip"><Icon.tag size={10}/>{t.value}</span>
      </div>
    </div>
  );
}

function mockReply(q) {
  const lower = q.toLowerCase();
  if (lower.includes("pricing") || lower.includes("price")) {
    return { who: "ai", text: "The pricing schedule is at **Annexure C**, page 41. Bidders must submit per-line-item costing plus a 5-year total. Note that **rates are evaluated using the 90/10 PPPFA split**.", bullets: [{ sev: "warn", title: "Bid security required", body: "A 2% performance guarantee (R 490,000 estimated) must accompany your bid. Pre-approved bank letter required." }], sources: [{ p: 41, sec: "Annex C" }] };
  }
  if (lower.includes("executive") || lower.includes("summary")) {
    return { who: "ai", text: "I can draft a 1-page executive summary covering your SOC track record, government client base, and ISO 27001 certification. Would you like me to **generate it now** and insert it into the Proposal Builder?", sources: [] };
  }
  if (lower.includes("missing") || lower.includes("requirement")) {
    return { who: "ai", text: "Three mandatory requirements are not currently met.", bullets: [{ sev: "fail", title: "Reference letters", body: "Section 3.7 requires three reference letters from revenue authorities. Only one has been provided." }, { sev: "warn", title: "CrowdStrike Falcon certification", body: "Section 3.8 mandates ≥2 certified engineers. Your HR vault shows 0 staff with this certification." }, { sev: "fail", title: "SBD 4 – Declaration of Interest", body: "Form not present in your document vault. I can auto-generate it from your CIPC company disclosure." }], sources: [{ p: 18, sec: "3.7" }, { p: 19, sec: "3.8" }, { p: 22, sec: "4.0" }] };
  }
  return { who: "ai", text: "Based on my reading, the key consideration is the **mandatory briefing on 28 May 2026**. Non-attendance disqualifies your bid. I can also draft the cover letter and SBD 4 for you whenever you're ready.", sources: [{ p: 27, sec: "5.0" }] };
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => { (acc[item[key]] = acc[item[key]] || []).push(item); return acc; }, {});
}

Object.assign(window, { AIChat });
