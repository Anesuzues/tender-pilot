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
        window.dispatchEvent(new Event("tp:session-expired"));
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

    async forgotPassword(email) {
      return this._fetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    }

    async resetPassword(token, new_password) {
      return this._fetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password }),
      });
    }

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

    async updateCompany(payload) {
      return this._fetch("/companies/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }

    async createCompany(payload) {
      return this._fetch("/companies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    /* -- Proposals -- */
    async getProposals() {
      const page = await this._fetch("/proposals");
      return page.items || page;
    }

    async getProposal(draftId) { return this._fetch("/proposals/" + draftId); }

    async createProposal(tender_id, title) {
      return this._fetch("/proposals", {
        method: "POST",
        body: JSON.stringify({ tender_id, title }),
      });
    }

    async generateSection(draftId, kind) {
      return this._fetch("/proposals/" + draftId + "/sections/generate", {
        method: "POST",
        body: JSON.stringify({ kind }),
      });
    }

    async updateSection(draftId, sectionId, payload) {
      return this._fetch("/proposals/" + draftId + "/sections/" + sectionId, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }

    async exportProposal(draftId, format) {
      // Returns a Blob for download
      const headers = {};
      if (this._token) headers["Authorization"] = "Bearer " + this._token;
      headers["Content-Type"] = "application/json";
      const res = await fetch(BASE + "/proposals/" + draftId + "/export", {
        method: "POST",
        headers,
        body: JSON.stringify({ format: format || "markdown" }),
      });
      if (!res.ok) throw new Error("Export failed (" + res.status + ")");
      return res.blob();
    }

    /* -- Notifications -- */
    async getNotifications() {
      const page = await this._fetch("/notifications");
      return page.items || page;
    }

    async markNotificationRead(id) {
      return this._fetch("/notifications/" + id + "/read", { method: "POST" });
    }

    async markAllNotificationsRead() {
      return this._fetch("/notifications/read-all", { method: "POST" });
    }

    /* -- Document delete -- */
    async deleteDocument(docId) {
      return this._fetch("/documents/" + docId, { method: "DELETE" });
    }

    /* -- Public tender discovery (eTenders feed) -- */
    async getPublicTenders(params) {
      return this._fetch("/public-tenders" + qs(params));
    }

    async importPublicTender(publicId) {
      const t = await this._fetch("/public-tenders/" + publicId + "/import", { method: "POST" });
      return normalizeTender(t);
    }

    async syncPublicTenders() {
      return this._fetch("/public-tenders/sync", { method: "POST" });
    }

    /* -- Admin / Platform -- */
    async getAdminOverview() { return this._fetch("/admin/overview"); }
    async getPlatformOverview() { return this._fetch("/admin/platform"); }
    async getAuditLogs(limit) { return this._fetch("/admin/audit-logs" + qs({ limit })); }

    /* -- File downloads (return Blob) -- */
    async _downloadBlob(path) {
      const headers = {};
      if (this._token) headers["Authorization"] = "Bearer " + this._token;
      const res = await fetch(BASE + path, { headers });
      if (!res.ok) throw new Error("Download failed (" + res.status + ")");
      return res.blob();
    }
    async downloadTenderFile(apiId) { return this._downloadBlob("/tenders/" + apiId + "/file"); }
    async downloadDocumentFile(docId) { return this._downloadBlob("/documents/" + docId + "/file"); }
  }

  /* ---------- shared client-side helpers ---------- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); ta.remove();
        return true;
      } catch { return false; }
    }
  }

  function toast(msg) {
    let el = document.getElementById("tp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "tp-toast";
      el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0E1216;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.25);transition:opacity .2s,transform .2s;opacity:0;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(-50%) translateY(8px)"; }, 2400);
  }

  window.API = new ApiClient();
  window.normalizeTender = normalizeTender;
  window.normalizeDoc = normalizeDoc;
  window.downloadBlob = downloadBlob;
  window.copyToClipboard = copyToClipboard;
  window.toast = toast;
})(window);
