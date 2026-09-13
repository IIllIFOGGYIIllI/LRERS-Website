(() => {
  const cfg = window.LRERS_CONFIG;
  const token = () => sessionStorage.getItem(cfg.sessionStorageKey) || "";

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (options.auth !== false && token()) headers.set("Authorization", `Bearer ${token()}`);
    const response = await fetch(`${cfg.apiBase}${path}`, { ...options, headers });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (response.status === 401 && options.auth !== false) {
      sessionStorage.removeItem(cfg.sessionStorageKey);
      window.dispatchEvent(new CustomEvent("lrers-auth-expired"));
    }
    if (!response.ok) {
      const error = new Error(data?.error || data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  window.LRERS_API = Object.freeze({
    meta: () => request("/api/v1/public/meta", { auth: false }),
    status: () => request("/api/v1/public/status", { auth: false }),
    resources: () => request("/api/v1/public/resources", { auth: false }),
    loginUrl: () => `${cfg.apiBase}/api/v1/auth/login`,
    exchange: code => request("/api/v1/auth/exchange", { method: "POST", body: JSON.stringify({ code }), auth: false }),
    me: () => request("/api/v1/auth/me"),
    logout: () => request("/api/v1/auth/logout", { method: "POST" }),
    audit: (limit = 30) => request(`/api/v1/admin/audit?limit=${encodeURIComponent(limit)}`),
    restartResource: resource => request(`/api/v1/admin/resources/${encodeURIComponent(resource)}/restart`, { method: "POST" }),
    announce: message => request("/api/v1/admin/announce", { method: "POST", body: JSON.stringify({ message }) }),
    saveSession: value => value ? sessionStorage.setItem(cfg.sessionStorageKey, value) : sessionStorage.removeItem(cfg.sessionStorageKey),
    hasSession: () => Boolean(token())
  });
})();
