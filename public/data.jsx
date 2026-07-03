/* ---------- App navigation ---------- */
/* All business data (tenders, documents, analytics, chat, proposals) is loaded
   live from the API. This file holds only static navigation configuration. */
const NAV = [
  { section: "Workspace", items: [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "discover", label: "Discover Tenders", icon: "globe", badge: "NEW" },
    { id: "tenders", label: "Tenders", icon: "file" },
    { id: "upload", label: "Upload Tender", icon: "upload" },
    { id: "analysis", label: "Tender Analysis", icon: "scan", badge: "AI" },
    { id: "chat", label: "AI Assistant", icon: "spark", badge: "AI" },
  ]},
  { section: "Proposals", items: [
    { id: "builder", label: "Proposal Builder", icon: "edit" },
    { id: "compliance", label: "Compliance", icon: "shield" },
    { id: "vault", label: "Document Vault", icon: "vault" },
  ]},
  { section: "Insights", items: [
    { id: "analytics", label: "Analytics", icon: "chart" },
    { id: "profile", label: "Company Profile", icon: "building" },
  ]},
  { section: "Account", items: [
    { id: "pricing", label: "Pricing", icon: "tag" },
    { id: "admin", label: "Admin", icon: "settings" },
  ]},
];

Object.assign(window, { NAV });
