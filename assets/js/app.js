(() => {
  const cfg = window.LRERS_CONFIG;
  const api = window.LRERS_API;
  const views = Object.assign(window.LRERS_VIEWS, window.LRERS_COMMUNITY_VIEWS);
  const app = document.getElementById("app");
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const state = { meta: null, status: null, resources: null, audit: null, community: null, communityError: null, selectedPanel: null, panelTemplate: "rules", auth: { enabled: false, user: null }, lastFetch: 0, resourcesFetched: 0, auditFetched: 0 };
  const routes = {
    overview: ["Overview", "Live server operations at a glance."],
    server: ["Server", "FiveM status, restart schedule and connection details."],
    players: ["Players", "Current roster and player administration."],
    resources: ["Resources", "Read-only FiveM resource inventory. Use txAdmin for changes."],
    admin: ["Admin Centre", "Discord-authenticated LRERS administration."],
    discord: ["Discord Management", "Welcome messages, member settings and roles."],
    panels: ["Panel Manager", "Dedicated Discord panels, content and publishing."],
    audit: ["Audit Log", "Staff actions, automation and server-operation history."],
    integrations: ["Integrations", "Connected LRERS, FiveM and infrastructure systems."],
    settings: ["Settings", "Server-scoped configuration and permissions."]
  };

  function route() {
    const value = location.hash.replace(/^#\/?/, "").split("?")[0];
    return routes[value] ? value : cfg.defaultRoute;
  }
  const adminDataRoute = () => ["admin", "audit"].includes(route());
  const resourceDataRoute = () => ["resources"].includes(route());
  const communityRoute = () => ["discord", "panels"].includes(route());

  function setApiState(ok) {
    document.getElementById("apiDot").className = `dot ${ok ? "online" : "offline"}`;
    document.getElementById("apiLabel").textContent = ok ? "Railway API connected" : "Railway API unavailable";
  }
  function toast(text) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = text;
    document.getElementById("toasts").appendChild(el); setTimeout(() => el.remove(), 3600);
  }
  function renderAuth() {
    const area = document.getElementById("authArea");
    if (!state.auth.enabled) { area.innerHTML = `<button class="button discord disabled" title="Discord OAuth is not configured">Discord Sign In</button>`; return; }
    if (!state.auth.user) { area.innerHTML = `<button class="button discord" data-login>Sign in with Discord</button>`; return; }
    const u = state.auth.user;
    const displayName = escapeHtml(u.display_name);
    const avatar = u.avatar_url ? escapeHtml(u.avatar_url) : "";
    area.innerHTML = `<div class="user-chip">${avatar ? `<img src="${avatar}" alt="">` : `<span class="avatar-fallback">${escapeHtml((u.display_name||'?').slice(0,1).toUpperCase())}</span>`}<div><b>${displayName}</b><small>${u.is_admin ? (u.is_owner ? 'Owner' : 'Admin') : 'Member'}</small></div><button class="signout" data-logout aria-label="Sign out">×</button></div>`;
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
    api.saveSession(""); state.auth.user = null; state.audit = null; state.community = null; toast("Signed out of LRERS"); render();
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
    const now = Date.now(); if (!force && state.audit && now - state.auditFetched < 10000) return;
    try { state.audit = await api.audit(50); state.auditFetched = now; }
    catch (err) { console.warn(err); state.audit = { entries: [] }; }
  }

  async function loadCommunity() {
    if (!state.auth.user?.is_admin) { state.community = null; return; }
    try { state.community = await api.discordContext(); state.communityError = null; }
    catch (err) { state.communityError = err.message; console.warn('Community load failed:', err); }
  }

  async function communityWrite(promise, success) {
    try { await promise; toast(success); await loadCommunity(); await loadAudit(true); render(); }
    catch (err) { toast(`Discord action failed: ${err.message}`); }
  }

  function bindCommunity() {
    document.querySelectorAll('[data-reload-discord]').forEach(el => el.addEventListener('click', async () => { await loadCommunity(); render(); }));
    document.querySelectorAll('[data-discord-setup]').forEach(el => el.addEventListener('click', () => {
      if (!confirm('Create the private LRERS bot configuration channel?')) return;
      communityWrite(api.discordSetup(), 'Discord configuration ready');
    }));
    document.querySelectorAll('[data-community-message]').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form); const kind = form.dataset.communityMessage;
      communityWrite(api.discordMessage(kind, {enabled: data.has('enabled'), channel_id: data.get('channel_id') || null, message: data.get('message')}), `${kind} settings saved`);
    }));
    const autoRole = document.getElementById('autoRoleForm');
    if (autoRole) autoRole.addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(autoRole);
      communityWrite(api.discordAutoRole(data.get('role_id') || null), 'Automatic role setting saved');
    });
    document.querySelectorAll('[data-panel-select]').forEach(el => el.addEventListener('click', () => {state.selectedPanel=el.dataset.panelSelect;state.panelTemplate='';render();}));
    document.querySelectorAll('[data-panel-template]').forEach(el => el.addEventListener('click', () => {state.selectedPanel=null;state.panelTemplate=el.dataset.panelTemplate;render();}));
    document.querySelectorAll('[data-panel-new]').forEach(el => el.addEventListener('click', () => {state.selectedPanel=null;state.panelTemplate='';render();}));
    const panelForm = document.getElementById('panelEditor');
    const body = panelForm?.querySelector('[data-panel-body]');
    const length = panelForm?.querySelector('[data-panel-length]');
    if (body && length) {
      const updateLength = () => {length.textContent = `${body.value.length.toLocaleString()} / 15,000 characters (published in up to five messages)`;};
      body.addEventListener('input', updateLength); updateLength();
      const preview = panelForm.querySelector('[data-panel-preview]');
      const titleInput = panelForm.querySelector('[name=title]');
      const colorSelect = panelForm.querySelector('[name=color]');
      const updatePreview = () => {
        preview.querySelector('[data-preview-title]').textContent = titleInput.value || 'Panel title';
        preview.querySelector('[data-preview-body]').textContent = body.value || 'Your approved panel content will appear here as you type.';
        preview.dataset.color = colorSelect.value;
      };
      [body, titleInput, colorSelect].forEach(el => el.addEventListener('input', updatePreview));
      colorSelect.addEventListener('change', updatePreview);
      updatePreview();
    }
    if (panelForm) panelForm.addEventListener('submit', async event => {
      event.preventDefault(); const data=new FormData(panelForm); const id=String(data.get('panel_id')||'').trim();
      const kind=String(data.get('kind')||'information');
      const roles=kind==='information' ? [] : data.getAll('role_ids');
      if (roles.length > 8) {toast('Choose no more than eight roles. Make a separate roles panel for another group.');return;}
      if (kind==='verification' && roles.length !== 1) {toast('Choose exactly one verification role, such as Rules Read.');return;}
      if (kind==='roles' && !roles.length) {toast('Choose at least one safely assignable role.');return;}
      const payload={title:data.get('title'),body:data.get('body'),kind,color:data.get('color'),role_ids:roles};
      try { await api.discordSavePanel(id, payload); state.selectedPanel=id;state.panelTemplate=''; toast('Panel saved as a draft');await loadCommunity();await loadAudit(true);render(); }
      catch (err) {toast(`Panel save failed: ${err.message}`);}
    });
    const publishForm = document.getElementById('publishPanelForm');
    if (publishForm) publishForm.addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(publishForm);const id=state.selectedPanel;
      if (!id || !confirm(`Publish ${id} to the selected Discord channel?`)) return;
      communityWrite(api.discordPublishPanel(id, data.get('channel_id')), 'Discord panel published/updated');
    });
  }

  function applyAuditFilters() {
    const search = document.getElementById("auditSearch");
    const status = document.getElementById("auditStatus");
    const category = document.getElementById("auditCategory");
    const q = (search?.value || "").trim().toLowerCase();
    const statusValue = (status?.value || "").toLowerCase();
    const categoryValue = (category?.value || "").toLowerCase();
    document.querySelectorAll("[data-audit-row]").forEach(row => {
      const matchText = !q || row.textContent.toLowerCase().includes(q);
      const matchStatus = !statusValue || row.dataset.auditStatus === statusValue;
      const matchCategory = !categoryValue || row.dataset.auditCategory === categoryValue;
      row.hidden = !(matchText && matchStatus && matchCategory);
    });
  }

  function bindDynamic() {
    document.querySelectorAll("[data-login]").forEach(el => el.addEventListener("click", login));
    document.querySelectorAll("[data-logout]").forEach(el => el.addEventListener("click", logout));
    document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || ""; if (!text) return;
      try { await navigator.clipboard.writeText(text); toast("F8 connect command copied"); }
      catch { toast("Copy failed — select the command manually"); }
    }));
    bindCommunity();

    const form = document.getElementById("announceForm");
    if (form) form.addEventListener("submit", async e => {
      e.preventDefault(); const field = document.getElementById("announceMessage"); const message = field.value.trim(); if (!message) return;
      if (!confirm(`Send this announcement to all connected players?\n\n${message}`)) return;
      const button = form.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Sending…";
      try { const result = await api.announce(message); field.value = ""; toast(result.message || "Announcement sent"); await loadAudit(true); render(); }
      catch (err) { toast(`Announcement failed: ${err.message}`); }
      finally { button.disabled = false; button.textContent = "Send Announcement"; }
    });

    const search = document.getElementById("resourceSearch");
    if (search) search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll("[data-resource-row]").forEach(row => row.hidden = !row.textContent.toLowerCase().includes(q));
    });

    ["auditSearch", "auditStatus", "auditCategory"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === "auditSearch" ? "input" : "change", applyAuditFilters);
    });
    const refreshAudit = document.getElementById("refreshAudit");
    if (refreshAudit) refreshAudit.addEventListener("click", async () => {
      refreshAudit.disabled = true; refreshAudit.textContent = "Refreshing…";
      await loadAudit(true); render(); toast("Audit refreshed");
    });
  }

  async function refresh(forceResources = false) {
    try {
      const now = Date.now();
      const tasks = [api.meta(), api.status()];
      const needsResources = forceResources || resourceDataRoute() || !state.resources || now - state.resourcesFetched > cfg.resourceRefreshMs;
      if (needsResources) tasks.push(api.resources());
      const results = await Promise.all(tasks);
      state.meta = results[0]; state.status = results[1];
      if (needsResources) { state.resources = results[2]; state.resourcesFetched = now; }
      await loadAuth();
      if (adminDataRoute()) await loadAudit();
      state.lastFetch = now; setApiState(true);
      document.getElementById("lastUpdated").textContent = `Live data updated ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      if (communityRoute() && document.activeElement?.closest("form")) updateChrome();
      else render();
    } catch (err) {
      console.error(err); setApiState(false);
      if (!state.meta) app.innerHTML = `<section class="panel error-panel"><span class="eyebrow">CONNECTION ERROR</span><h2>Railway API unavailable</h2><p>The website is online, but live FiveM data could not be loaded. The dashboard will retry automatically.</p></section>`;
      updateChrome();
    }
  }

  window.addEventListener("hashchange", async () => {
    if (adminDataRoute()) await loadAudit(true);
    if (communityRoute()) await loadCommunity();
    render();
    if (resourceDataRoute()) refresh(true);
    document.getElementById("sidebar").classList.remove("open");
  });
  window.addEventListener("lrers-auth-expired", () => { state.auth.user = null; state.audit = null; toast("Your LRERS sign-in session expired"); render(); });
  document.getElementById("menuButton").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
  document.getElementById("websiteVersion").textContent = `v${cfg.websiteVersion}`;
  if (!location.hash) location.hash = `#/${cfg.defaultRoute}`;
  (async () => { await refresh(resourceDataRoute()); await consumeAuthCode(); await loadAuth(); if (adminDataRoute()) await loadAudit(true); if (communityRoute()) await loadCommunity(); render(); })();
  setInterval(() => refresh(resourceDataRoute()), cfg.refreshMs);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(console.warn);
})();
