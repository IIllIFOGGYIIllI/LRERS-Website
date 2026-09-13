(() => {
  const cfg = window.LRERS_CONFIG;
  const api = window.LRERS_API;
  const views = window.LRERS_VIEWS;
  const app = document.getElementById("app");
  const state = { meta: null, status: null, resources: null, audit: null, auth: { enabled: false, user: null }, lastFetch: 0, resourcesFetched: 0, auditFetched: 0 };
  const routes = {
    overview: ["Overview", "Live server operations at a glance."],
    server: ["Server", "FiveM status, restart schedule and connection details."],
    players: ["Players", "Current roster and player administration."],
    resources: ["Resources", "Live FiveM resource inventory and protected controls."],
    admin: ["Admin Centre", "Discord-authenticated LRERS administration."],
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
  function toast(text) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = text;
    document.getElementById("toasts").appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  function renderAuth() {
    const area = document.getElementById("authArea");
    if (!state.auth.enabled) { area.innerHTML = `<button class="button discord disabled" title="Discord OAuth is not configured">Discord Sign In</button>`; return; }
    if (!state.auth.user) { area.innerHTML = `<button class="button discord" data-login>Sign in with Discord</button>`; return; }
    const u = state.auth.user;
    area.innerHTML = `<div class="user-chip">${u.avatar_url ? `<img src="${u.avatar_url}" alt="">` : `<span class="avatar-fallback">${(u.display_name||'?').slice(0,1).toUpperCase()}</span>`}<div><b>${u.display_name}</b><small>${u.is_admin ? (u.is_owner ? 'Owner' : 'Admin') : 'Member'}</small></div><button class="signout" data-logout aria-label="Sign out">×</button></div>`;
  }
  function updateChrome() {
    const r = route(); const [title, subtitle] = routes[r];
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = subtitle;
    document.querySelectorAll("[data-route]").forEach(a => a.classList.toggle("active", a.dataset.route === r));
    document.querySelectorAll("[data-admin-nav]").forEach(a => a.classList.toggle("verified", Boolean(state.auth.user?.is_admin)));
    const online = Boolean(state.status?.online);
    document.getElementById("serverPill").className = `server-pill ${online ? "online" : "offline"}`;
    document.getElementById("serverPill").innerHTML = `<span class="dot"></span><span>${online ? `${state.status.players}/${state.status.max_players} Online` : "Server Offline"}</span>`;
    const connect = document.getElementById("connectTop");
    if (state.meta?.join_url) { connect.href = state.meta.join_url; connect.classList.remove("disabled"); }
    else { connect.href = "#"; connect.classList.add("disabled"); }
    renderAuth();
  }
  function render() {
    const r = route(); updateChrome();
    const fn = views[r] || views.overview;
    app.innerHTML = fn(state);
    bindDynamic();
  }
  function login() { location.href = api.loginUrl(); }
  async function logout() {
    try { await api.logout(); } catch (err) { console.warn(err); }
    api.saveSession(""); state.auth.user = null; state.audit = null; toast("Signed out of LRERS"); render();
  }
  async function loadAuth() {
    state.auth.enabled = Boolean(state.meta?.discord_auth_enabled);
    if (!state.auth.enabled || !api.hasSession()) { state.auth.user = null; return; }
    try { const data = await api.me(); state.auth.user = data.user || null; }
    catch { api.saveSession(""); state.auth.user = null; }
  }
  async function consumeAuthCode() {
    const url = new URL(location.href);
    const code = url.searchParams.get("auth_code");
    const authError = url.searchParams.get("auth_error");
    if (!code && !authError) return;
    url.searchParams.delete("auth_code"); url.searchParams.delete("auth_error");
    history.replaceState({}, "", `${url.pathname}${url.search}${location.hash || '#/overview'}`);
    if (authError) { toast(`Discord sign in failed: ${authError}`); return; }
    try {
      const result = await api.exchange(code);
      api.saveSession(result.session_token);
      state.auth.user = result.user;
      toast(`Signed in as ${result.user.display_name}`);
    } catch (err) { toast(`Discord sign in failed: ${err.message}`); }
  }
  async function loadAudit(force = false) {
    if (!state.auth.user?.is_admin) { state.audit = null; return; }
    const now = Date.now(); if (!force && state.audit && now - state.auditFetched < 15000) return;
    try { state.audit = await api.audit(40); state.auditFetched = now; }
    catch (err) { console.warn(err); state.audit = { entries: [] }; }
  }
  function bindDynamic() {
    document.querySelectorAll("[data-login]").forEach(el => el.addEventListener("click", login));
    document.querySelectorAll("[data-logout]").forEach(el => el.addEventListener("click", logout));
    document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || ""; if (!text) return;
      try { await navigator.clipboard.writeText(text); toast("F8 connect command copied"); }
      catch { toast("Copy failed — select the command manually"); }
    }));
    document.querySelectorAll("[data-restart-resource]").forEach(btn => btn.addEventListener("click", async () => {
      const resource = btn.dataset.restartResource; if (!resource) return;
      if (!confirm(`Restart ${resource}?`)) return;
      const original = btn.textContent; btn.disabled = true; btn.textContent = "Restarting…";
      try { const result = await api.restartResource(resource); toast(result.message || `${resource} restart requested`); await refresh(true); }
      catch (err) { toast(`Restart failed: ${err.message}`); }
      finally { btn.disabled = false; btn.textContent = original; }
    }));
    const form = document.getElementById("announceForm");
    if (form) form.addEventListener("submit", async e => {
      e.preventDefault(); const field = document.getElementById("announceMessage"); const message = field.value.trim(); if (!message) return;
      const button = form.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Sending…";
      try { const result = await api.announce(message); field.value = ""; toast(result.message || "Announcement sent"); await loadAudit(true); }
      catch (err) { toast(`Announcement failed: ${err.message}`); }
      finally { button.disabled = false; button.textContent = "Send Announcement"; }
    });
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
      await loadAuth();
      if (route() === "audit") await loadAudit();
      state.lastFetch = now; setApiState(true);
      document.getElementById("lastUpdated").textContent = `Live data updated ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      render();
    } catch (err) {
      console.error(err); setApiState(false);
      if (!state.meta) app.innerHTML = `<section class="panel error-panel"><span class="eyebrow">CONNECTION ERROR</span><h2>Railway API unavailable</h2><p>The website is online, but live FiveM data could not be loaded. The dashboard will retry automatically.</p></section>`;
      updateChrome();
    }
  }

  window.addEventListener("hashchange", async () => { if (route() === "audit") await loadAudit(true); render(); if (route() === "resources") refresh(true); document.getElementById("sidebar").classList.remove("open"); });
  window.addEventListener("lrers-auth-expired", () => { state.auth.user = null; state.audit = null; toast("Your LRERS sign-in session expired"); render(); });
  document.getElementById("menuButton").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
  document.getElementById("websiteVersion").textContent = `v${cfg.websiteVersion}`;
  if (!location.hash) location.hash = `#/${cfg.defaultRoute}`;
  (async () => { await refresh(route() === "resources"); await consumeAuthCode(); await loadAuth(); if (route() === "audit") await loadAudit(true); render(); })();
  setInterval(() => refresh(route() === "resources"), cfg.refreshMs);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(console.warn);
})();
