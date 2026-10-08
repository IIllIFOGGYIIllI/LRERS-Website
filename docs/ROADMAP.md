## v0.4.0 — Discord Management & Panel Manager
- New Discord Management navigation and controls for welcome, goodbye and auto-roles.
- Discord panel drafts and explicit publishing for rules, information, verification and role panels.
- Resource inventory is read-only: operations stay within txAdmin.
- Matching bot v0.5.0 required. No FiveM bridge change.

(() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatDuration = (seconds) => {
    seconds = Math.max(0, Number(seconds || 0));
    const d = Math.floor(seconds / 86400); seconds %= 86400;
    const h = Math.floor(seconds / 3600); seconds %= 3600;
    const m = Math.floor(seconds / 60);
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    return `${m}m`;
  };
  const restartText = (s) => {
    if (!s || !s.online) return "—";
    if (s.next_restart_state === "skipped") return "Skipped";
    if (s.next_restart_state === "restarting") return "Restarting";
    if (s.next_restart_state === "scheduled") return `in ${formatDuration(s.next_restart_seconds)}`;
    return "txAdmin managed";
  };
  const statusBadge = (online) => `<span class="status-badge ${online ? 'online' : 'offline'}"><span class="dot"></span>${online ? 'Online' : 'Offline'}</span>`;
  const card = (label, value, sub = "") => `<article class="metric-card"><span>${label}</span><strong>${value}</strong>${sub ? `<small>${sub}</small>` : ""}</article>`;
  const empty = (title, text) => `<div class="empty-state"><strong>${title}</strong><p>${text}</p></div>`;

  function accessPanel(auth, title = "Administration") {
    if (!auth?.enabled) return `<section class="panel locked"><span class="eyebrow">DISCORD AUTHENTICATION</span><h2>${title}</h2><p>Discord sign-in is built into this website, but the Railway OAuth credentials have not been enabled yet.</p></section>`;
    if (!auth?.user) return `<section class="panel auth-gate"><span class="eyebrow">DISCORD SIGN IN REQUIRED</span><h2>${title}</h2><p>Sign in with Discord to verify your LRERS server membership and permissions.</p><button class="button discord" data-login>Sign in with Discord</button></section>`;
    if (!auth.user.is_admin) return `<section class="panel error-panel"><span class="eyebrow">ACCESS RESTRICTED</span><h2>${title}</h2><p>You are signed in as <b>${escapeHtml(auth.user.display_name)}</b>, but this account does not have LRERS administration permission.</p></section>`;
    return "";
  }

  function playerTable(status, compact = false) {
    const players = Array.isArray(status?.player_list) ? status.player_list : [];
    if (!players.length) return empty("No players online", "The server is currently empty.");
    const rows = players.map(p => `<tr><td><span class="player-id">${escapeHtml(p.id)}</span></td><td><b>${escapeHtml(p.name)}</b></td><td>${escapeHtml(p.ping)} ms</td></tr>`).join("");
    return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Player</th><th>Ping</th></tr></thead><tbody>${rows}</tbody></table></div>${compact ? "" : `<p class="table-note">Live player data refreshes automatically.</p>`}`;
  }

  function auditRows(entries, limit = entries.length) {
    return entries.slice(0, limit).map(e => `<tr data-audit-row data-audit-status="${escapeHtml(String(e.status || '').toLowerCase())}" data-audit-category="${escapeHtml(String(e.category || '').toLowerCase())}"><td>${new Date(e.created_at).toLocaleString()}</td><td><span class="audit-status ${escapeHtml(String(e.status||'').toLowerCase())}">${escapeHtml(e.status)}</span></td><td>${escapeHtml(e.actor || 'System')}</td><td><code class="category-code">${escapeHtml(e.category)}</code></td><td>${escapeHtml(e.summary)}</td><td>${escapeHtml(e.result || '—')}</td></tr>`).join("");
  }

  function overview({status, meta, auth}) {
    const count = `${status?.players ?? 0}/${status?.max_players ?? 0}`;
    return `
      <section class="hero hero-branded panel">
        <div class="hero-copy"><span class="eyebrow">LIVE OPERATIONS</span><h2>${escapeHtml(meta?.server_name || "Local Response ERS")}</h2><p>Central status, administration and integration platform for the LRERS FiveM ecosystem.</p><div class="hero-status">${statusBadge(Boolean(status?.online))}${auth?.user ? `<span class="tag good">Discord: ${escapeHtml(auth.user.display_name)}</span>` : ""}</div></div>
        <div class="hero-art"><img src="assets/img/lrers-server-logo.png" alt="Local Response ERS server logo"></div>
      </section>
      <section class="metrics-grid">
        ${card("Players", count, status?.online ? "Current session" : "Server unavailable")}
        ${card("Uptime", status?.online ? formatDuration(status.uptime_seconds) : "—", "FXServer uptime")}
        ${card("Next Restart", restartText(status), "txAdmin schedule")}
        ${card("Game Build", status?.game_build || "—", "FiveM build")}
      </section>
      <section class="grid two">
        <article class="panel"><div class="panel-head"><div><span class="eyebrow">CURRENT SESSION</span><h3>Players</h3></div><a href="#/players" class="text-link">View all →</a></div>${playerTable(status, true)}</article>
        <article class="panel"><div class="panel-head"><div><span class="eyebrow">CONNECT</span><h3>Join the server</h3></div></div><div class="connect-box"><code>${escapeHtml(meta?.connect_command || "Not configured")}</code><button class="button" data-copy="${escapeHtml(meta?.connect_command || "")}">Copy F8 Command</button>${meta?.join_url ? `<a class="button secondary" href="${escapeHtml(meta.join_url)}" target="_blank" rel="noopener">Open FiveM</a>` : ""}</div></article>
      </section>
      <section class="panel"><div class="panel-head"><div><span class="eyebrow">OPERATIONS PLATFORM</span><h3>LRERS Control Surface</h3></div><span class="tag ${auth?.user?.is_admin ? 'good' : ''}">${auth?.user?.is_admin ? 'Admin Connected' : 'Building'}</span></div><div class="feature-grid">${[
        ["Discord Authentication",auth?.user ? `Signed in as ${escapeHtml(auth.user.display_name)}.` : "Secure Discord OAuth and LRERS permission verification."],
        ["Player Administration","Lookup, moderation, notes and history."],
        ["Discord Management","Member welcome, verification, roles and dedicated panels."],
        ["Audit Centre",auth?.user?.is_admin ? "Authenticated administration history is available." : "Staff and automation action history."],
        ["LRERS Characters","Character, duty, department and rank integration."],
        ["Custom Resources","VehicleSpawner, SignalPreempt, ClearPath AI and more."]
      ].map(([a,b])=>`<div class="feature"><strong>${a}</strong><span>${b}</span></div>`).join("")}</div></section>`;
  }

  function server({status, meta}) {
    return `<section class="metrics-grid">${card("Status", status?.online ? "Online" : "Offline")}${card("Players", `${status?.players ?? 0}/${status?.max_players ?? 0}`)}${card("Uptime", status?.online ? formatDuration(status.uptime_seconds) : "—")}${card("Next Restart", restartText(status))}</section>
    <section class="grid two"><article class="panel"><div class="panel-head"><div><span class="eyebrow">SERVER DETAILS</span><h3>${escapeHtml(meta?.server_name || "Local Response ERS")}</h3></div>${statusBadge(Boolean(status?.online))}</div><dl class="detail-list"><div><dt>Game Build</dt><dd>${escapeHtml(status?.game_build || "—")}</dd></div><div><dt>Server ID</dt><dd>${escapeHtml(meta?.server_id || "—")}</dd></div><div><dt>Last Update</dt><dd>${status?.updated_at ? new Date(status.updated_at).toLocaleString() : "—"}</dd></div></dl></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">CONNECTION</span><h3>Join LRERS</h3></div></div><div class="connect-box"><label>F8 Connect Command</label><code>${escapeHtml(meta?.connect_command || "Not configured")}</code><button class="button" data-copy="${escapeHtml(meta?.connect_command || "")}">Copy</button>${meta?.browser_url ? `<a class="button secondary" href="${escapeHtml(meta.browser_url)}" target="_blank" rel="noopener">Server Listing</a>` : ""}</div></article></section>`;
  }

  function players({status, auth}) {
    const adminNote = auth?.user?.is_admin ? `<section class="panel locked"><div class="panel-head"><div><span class="eyebrow">NEXT MODULE</span><h3>Player Administration</h3></div><span class="tag good">Authenticated</span></div><p>Your Discord administrator session is active. Player lookup, warnings, kicks, bans, notes, playtime and LRERS character linkage are the next backend/bridge phase.</p></section>` : `${accessPanel(auth, "Player Administration") || `<section class="panel locked"><p>Administrator access confirmed. Player moderation endpoints are the next phase.</p></section>`}`;
    return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">LIVE ROSTER</span><h3>Players <span class="muted">${status?.players ?? 0}/${status?.max_players ?? 0}</span></h3></div>${statusBadge(Boolean(status?.online))}</div>${playerTable(status)}</section>${adminNote}`;
  }

  function resources({resources}) {
    const items = Array.isArray(resources?.resources) ? resources.resources : [];
    const counts = items.reduce((a,r)=>{const k=(r.state||'unknown').toLowerCase();a[k]=(a[k]||0)+1;return a;},{});
    const rows = items.map(r=>`<tr data-resource-row><td><b>${escapeHtml(r.name)}</b></td><td><span class="resource-state ${escapeHtml(r.state)}">${escapeHtml(r.state)}</span></td></tr>`).join('');
    return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">TXADMIN AUTHORITY</span><h3>Read-only Resource Inventory</h3></div></div><p>Use txAdmin or the FiveM console for starting, stopping and restarting resources.</p></section><section class="metrics-grid compact">${card('Started', counts.started||0)}${card('Stopped',counts.stopped||0)}${card('Total',items.length)}</section><section class="panel"><div class="panel-head"><h3>Resource Directory</h3><input id="resourceSearch" class="search" placeholder="Search resources…"></div>${items.length?`<div class="table-wrap"><table><thead><tr><th>Resource</th><th>State</th></tr></thead><tbody>${rows}</tbody></table></div>`:empty('No resources reported','Wait for the FiveM bridge.')}</section>`;
  }

  function admin({auth,status,audit}) {
    const gate = accessPanel(auth, 'Admin Centre'); if(gate) return gate;
    const entries = Array.isArray(audit?.entries)?audit.entries:[];
    return `<section class="admin-hero panel"><div><span class="eyebrow">LRERS ADMINISTRATION</span><h2>Operations Centre</h2><p>Welcome, ${escapeHtml(auth.user.display_name)}. Discord community administration now has its own dedicated controls, while FiveM resource management stays in txAdmin.</p></div><div class="identity-card">${auth.user.avatar_url?`<img src="${escapeHtml(auth.user.avatar_url)}" alt="">`:''}<div><strong>${escapeHtml(auth.user.display_name)}</strong><span>${auth.user.is_owner?'Bot Owner':'Administrator'}</span></div></div></section>
    <section class="metrics-grid compact">${card('Server',status?.online?'Online':'Offline')}${card('Players',`${status?.players??0}/${status?.max_players??0}`)}${card('Next Restart',restartText(status))}</section>
    <section class="grid two"><article class="panel"><div class="panel-head"><div><span class="eyebrow">DISCORD</span><h3>Community Management</h3></div></div><div class="action-links"><a href="#/discord" class="action-link"><b>Member Settings</b><span>Welcome, goodbye and automatic roles</span></a><a href="#/panels" class="action-link"><b>Panel Manager</b><span>Rules, Information, Verification and role panels</span></a><a href="#/audit" class="action-link"><b>Audit Activity</b><span>Review admin and panel actions</span></a></div></article>
    <article class="panel"><div class="panel-head"><div><span class="eyebrow">IN-GAME</span><h3>Broadcast Announcement</h3></div></div><form id="announceForm" class="stack-form"><label for="announceMessage">Message to connected players</label><textarea id="announceMessage" maxlength="300" required></textarea><div class="form-foot"><span class="muted">The existing FiveM announcement integration is retained.</span><button class="button" type="submit">Send Announcement</button></div></form></article></section>
    <section class="panel"><div class="panel-head"><h3>Recent Audit Activity</h3><a href="#/audit" class="text-link">View all →</a></div>${entries.length?`<div class="table-wrap"><table><thead><tr><th>When</th><th>Status</th><th>Actor</th><th>Category</th><th>Action</th><th>Result</th></tr></thead><tbody>${auditRows(entries,8)}</tbody></table></div>`:empty('No activity','Actions will appear here as they occur.')}</section>`;
  }

  function audit({auth, audit}) {
    const gate = accessPanel(auth, "Audit Log"); if (gate) return gate;
    const entries = Array.isArray(audit?.entries) ? audit.entries : [];
    const statuses = [...new Set(entries.map(e => String(e.status || '').toUpperCase()).filter(Boolean))].sort();
    const categories = [...new Set(entries.map(e => String(e.category || '')).filter(Boolean))].sort();
    return `<section class="panel"><div class="panel-head audit-head"><div><span class="eyebrow">ADMIN HISTORY</span><h3>Runtime Audit Log</h3></div><div class="audit-tools"><input id="auditSearch" class="search" placeholder="Search audit…" autocomplete="off"><select id="auditStatus" class="select"><option value="">All statuses</option>${statuses.map(x=>`<option value="${escapeHtml(x.toLowerCase())}">${escapeHtml(x)}</option>`).join('')}</select><select id="auditCategory" class="select"><option value="">All categories</option>${categories.map(x=>`<option value="${escapeHtml(x.toLowerCase())}">${escapeHtml(x)}</option>`).join('')}</select><button class="button secondary mini" id="refreshAudit">Refresh</button></div></div>${entries.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Status</th><th>Actor</th><th>Category</th><th>Action</th><th>Result</th></tr></thead><tbody id="auditRows">${auditRows(entries)}</tbody></table></div>` : empty("No audit entries", "No administrative actions have been recorded during this Railway runtime.")}<p class="table-note">Audit history is currently runtime-backed and resets on Railway container replacement. Durable storage is planned.</p></section>`;
  }

  const planned = (title, description, features) => `<section class="panel"><span class="eyebrow">PLANNED MODULE</span><h2>${title}</h2><p>${description}</p><div class="feature-grid">${features.map(x=>`<div class="feature"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join("")}</div></section>`;
  const integrations = ({auth}) => planned("Integrations", "A single view of the systems connected to Local Response ERS.", [["Discord",auth?.user ? `Signed in as ${escapeHtml(auth.user.display_name)}.` : "OAuth identity and role-backed permissions."],["txAdmin","Scheduled restarts and infrastructure control."],["FiveM Bridge","Live server telemetry and protected action queue."],["LRERS","Characters, duty, jobs and permissions."],["VehicleSpawner","Garages, saved builds and diagnostics."],["SignalPreempt / ClearPath AI","Emergency-services traffic and AI integrations."]]);
  function settings({auth}) { const gate = accessPanel(auth, "Settings"); if (gate) return gate; return planned("Settings", "Server-scoped configuration will progressively move here instead of scattered config edits.", [["Server Metadata","Display name, capacity and connection details."],["Permissions","Discord role mappings and admin access."],["Notifications","Operational alert routing."],["Resource Policy","Resource operations remain in txAdmin."],["Website","Branding and dashboard behaviour."],["Safety","Confirmation and audit policy."]]); }

  window.LRERS_VIEWS = { overview, server, players, resources, admin, audit, integrations, settings };
})();


## Discord Management and Panel Manager (v0.4.0)

Requires LRERS Discord Bot v0.5.0 and an authenticated LRERS Discord admin.
Use Discord Management → Initialize Discord Management or `/community setup`
once to create the bot's private Discord-backed configuration channel. Save
Welcome, Goodbye and automatic member role policies, then draft and publish
Rules, Info, Verification, or self-assignable Role panels using Panel Manager.
The website doesn't publish panels without an explicit admin confirmation.

Welcome/goodbye and join-role actions require Discord's Server Members Intent
and `ENABLE_MEMBER_EVENTS=true` on Railway. Panel buttons do not require that
intent. Resource control buttons were removed from the website; use txAdmin.

Discord Community Phase 1: Welcome / Goodbye, role policy, Discord-backed panel manager.
Panel content will be customized from user-provided screenshots.
