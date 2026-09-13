(() => {
  const cfg = window.LRERS_CONFIG;
  const api = window.LRERS_API;
  const views = window.LRERS_VIEWS;
  const app = document.getElementById("app");
  const state = { meta: null, status: null, resources: null, lastFetch: 0, resourcesFetched: 0 };
  const routes = {
    overview: ["Overview", "Live server operations at a glance."],
    server: ["Server", "FiveM status, restart schedule and connection details."],
    players: ["Players", "Current roster and future player administration."],
    resources: ["Resources", "Live FiveM resource inventory and controls."],
    admin: ["Admin Centre", "Central administration and moderation workflows."],
    audit: ["Audit Log", "Staff actions, automation and server-operation history."],
    integrations: ["Integrations", "Connected LRERS, FiveM and infrastructure systems."],
    settings: ["Settings", "Server-scoped configuration and permissions."]
  };

  function route() {
    const value = location.hash.replace(/^#\/?/, "").split("?")[0];
    return routes[value] ? value : cfg.defaultRoute;
  }
  function setApiState(ok) {
    document.getElementById("apiDot").className = `dot ${ok ? "online" : "offline"}`;
    document.getElementById("apiLabel").textContent = ok ? "Railway API connected" : "Railway API unavailable";
  }
  function updateChrome() {
    const r = route(); const [title, subtitle] = routes[r];
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = subtitle;
    document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === r));
    const online = Boolean(state.status?.online);
    document.getElementById("serverPill").className = `server-pill ${online ? "online" : "offline"}`;
    document.getElementById("serverPill").innerHTML = `<span class="dot"></span><span>${online ? `${state.status.players}/${state.status.max_players} Online` : "Server Offline"}</span>`;
    const connect = document.getElementById("connectTop");
    if (state.meta?.join_url) { connect.href = state.meta.join_url; connect.classList.remove("disabled"); }
    else { connect.href = "#"; connect.classList.add("disabled"); }
  }
  function render() {
    const r = route(); updateChrome();
    const fn = views[r] || views.overview;
    app.innerHTML = fn(state);
    bindDynamic();
  }
  function toast(text) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = text;
    document.getElementById("toasts").appendChild(el); setTimeout(() => el.remove(), 2800);
  }
  function bindDynamic() {
    document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || ""; if (!text) return;
      try { await navigator.clipboard.writeText(text); toast("F8 connect command copied"); }
      catch { toast("Copy failed — select the command manually"); }
    }));
    const search = document.getElementById("resourceSearch");
    if (search) search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll("[data-resource-row]").forEach(row => row.hidden = !row.textContent.toLowerCase().includes(q));
    });
  }
  async function refresh(forceResources = false) {
    try {
      const now = Date.now();
      const tasks = [api.meta(), api.status()];
      const needsResources = forceResources || !state.resources || now - state.resourcesFetched > cfg.resourceRefreshMs;
      if (needsResources) tasks.push(api.resources());
      const results = await Promise.all(tasks);
      state.meta = results[0]; state.status = results[1];
      if (needsResources) { state.resources = results[2]; state.resourcesFetched = now; }
      state.lastFetch = now; setApiState(true);
      document.getElementById("lastUpdated").textContent = `Live data updated ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      render();
    } catch (err) {
      console.error(err); setApiState(false);
      if (!state.meta) app.innerHTML = `<section class="panel error-panel"><span class="eyebrow">CONNECTION ERROR</span><h2>Railway API unavailable</h2><p>The website is online, but live FiveM data could not be loaded. The dashboard will retry automatically.</p></section>`;
      updateChrome();
    }
  }

  window.addEventListener("hashchange", () => { render(); if (route() === "resources") refresh(true); });
  document.getElementById("menuButton").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
  document.getElementById("websiteVersion").textContent = `v${cfg.websiteVersion}`;
  if (!location.hash) location.hash = `#/${cfg.defaultRoute}`;
  refresh(route() === "resources");
  setInterval(() => refresh(route() === "resources"), cfg.refreshMs);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(console.warn);
})();
