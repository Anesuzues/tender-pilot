/* ---- TenderPilot API client ---- *
 * Uses relative paths so it works on the same origin (Vercel) and via proxy
 * in local dev. Falls back gracefully — pages keep mock data when offline.
 */
(function (window) {
  const BASE = "/api/v1";

  function qs(params) {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => v != null && q.set(k, String(v)));
    const s = q.toString();
    return s ? "?" + s : "";
  }

  /* ---------- normalize backend shapes to the frontend mock format ---------- */
  function normalizeTender(t) {
    return {
      _apiId: t.id,
      id: t.reference || t.id,
      title: t.title || "",
      issuer: t.issuer || "",
      type: t.type || "",
      value: t.value || "",
      deadline: t.deadline || "",
      closingDays: t.closing_days != null ? t.closing_days : null,
      bbbeeRequired: t.bbbee_required || "",
      score: t.score != null ? t.score : 0,
      risk: t.risk || "medium",
      status: t.workflow_status || "draft",
      province: t.province || "",
      cidb: t.cidb || null,
      documents: t.document_count || 0,
      pages: t.page_count || 0,
      publishedDate: t.published_date || "",
      tags: t.tags || [],
      summary: t.summary || "",
      processingStatus: t.processing_status || "pending",
    };
  }

  function normalizeDoc(d) {
    return {
      id: d.id,
      category: d.category,
      name: d.name,
      status: d.status,
      expires: d.expires_on || null,
      uploaded: d.uploaded_on || null,
      size: d.file_size || null,
      aiVerified: d.ai_verified || false,
      vendor: d.reference || null,
    };
  }

  /* ---------- core fetch wrapper ---------- */
  class ApiClient {
    constructor() {
      this._token = localStorage.getItem("tp_token") || null;
    }

    setToken(t) {
      this._token = t;
      if (t) localStorage.setItem("tp_token", t);
      else localStorage.removeItem("tp_token");
    }

    isLoggedIn() { return !!this._token; }

    async _fetch(path, opts) {
      const o = opts || {};
      const headers = Object.assign({}, o.headers || {});
      if (!(o.body instanceof FormData)) headers["Content-Type"] = "application/json";
      if (this._token) headers["Authorization"] = "Bearer " + this._token;

      const res = await fetch(BASE + path, Object.assign({}, o, { headers }));

      if (res.status === 401) {
        this.setToken(null);
        throw new Error("Session expired — please sign in again.");
      }

      let data;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = { detail: text }; }

      if (!res.ok) throw new Error((data && data.detail) || "Request failed (" + res.status + ")");
      return data;
    }

    /* -- Auth -- */
    async login(email, password) {
      const data = await this._fetch("/auth/login/json", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      this.setToken(data.tokens.access_token);
      return data.user;
    }

    async register(payload) {
      const data = await this._fetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      this.setToken(data.tokens.access_token);
      return data.user;
    }

    async me() { return this._fetch("/auth/me"); }

    logout() { this.setToken(null); }

    /* -- Tenders -- */
    async getTenders(params) {
      const page = await this._fetch("/tenders" + qs(params));
      return { items: page.items.map(normalizeTender), total: page.total };
    }

    async getTender(apiId) {
      const t = await this._fetch("/tenders/" + apiId);
      return normalizeTender(t);
    }

    async uploadTender(file) {
      const fd = new FormData();
      fd.append("file", file);
      const t = await this._fetch("/tenders/upload", { method: "POST", body: fd });
      return normalizeTender(t);
    }

    /* -- Analysis -- */
    async runAnalysis(apiId) { return this._fetch("/tenders/" + apiId + "/analysis", { method: "POST" }); }
    async getAnalysis(apiId) { return this._fetch("/tenders/" + apiId + "/analysis"); }

    /* -- Chat -- */
    async createChatSession(tender_id) {
      return this._fetch("/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ tender_id: tender_id || null }),
      });
    }

    async getChatSessions() { return this._fetch("/chat/sessions"); }

    async sendMessage(sessionId, question) {
      return this._fetch("/chat/sessions/" + sessionId + "/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
    }

    /* -- Documents -- */
    async getDocuments() {
      const vault = await this._fetch("/documents");
      return (vault.documents || []).map(normalizeDoc);
    }

    async uploadDocument(file, category, name, expiresOn) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      fd.append("name", name);
      if (expiresOn) fd.append("expires_on", expiresOn);
      return this._fetch("/documents/upload", { method: "POST", body: fd });
    }

    /* -- Analytics -- */
    async getAnalytics() { return this._fetch("/analytics/overview"); }

    /* -- Company -- */
    async getCompany() { return this._fetch("/companies/me"); }

    /* -- Proposals -- */
    async getProposals() {
      const page = await this._fetch("/proposals");
      return page.items || page;
    }

    async createProposal(tender_id) {
      return this._fetch("/proposals", {
        method: "POST",
        body: JSON.stringify({ tender_id }),
      });
    }

    /* -- Notifications -- */
    async getNotifications() {
      const page = await this._fetch("/notifications");
      return page.items || page;
    }
  }

  window.API = new ApiClient();
  window.normalizeTender = normalizeTender;
  window.normalizeDoc = normalizeDoc;
})(window);
