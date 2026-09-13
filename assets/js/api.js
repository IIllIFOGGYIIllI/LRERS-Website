(() => {
  const cfg = window.LRERS_CONFIG;

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);
    try {
      const response = await fetch(`${cfg.apiBase}${path}`, {
        method: options.method || "GET",
        headers: { "Accept": "application/json", ...(options.headers || {}) },
        signal: controller.signal,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  window.LRERS_API = {
    health: () => request("/health"),
    meta: () => request("/api/v1/public/meta"),
    status: () => request("/api/v1/public/status"),
    resources: () => request("/api/v1/public/resources")
  };
})();
