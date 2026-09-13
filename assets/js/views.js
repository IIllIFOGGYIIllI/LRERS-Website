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

  function overview({status, meta, auth}) {
    const count = `${status?.players ?? 0}/${status?.max_players ?? 0}`;
    return `
      <section class="hero hero-branded panel">
        <div class="hero-copy"><span class="eyebrow">LIVE OPERATIONS</span><h2>${escapeHtml(meta?.server_name || "Local Response ERS")}</h2><p>Central status, administration and integration platform for the LRERS FiveM ecosystem.</p><div class="hero-status">${statusBadge(Boolean(status?.online))}${auth?.user ? `<span class="tag good">Discord: ${escapeHtml(auth.user.display_name)}</span>` : ""}</div></div>
        <div class="hero-art"><img src="assets/img/lrers-server-logo.jpg" alt="Local Response ERS server logo"></div>
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
        ["Resource Control",auth?.user?.is_admin ? "Authenticated resource restart controls are available." : "Protected start, stop, restart and health monitoring."],
        ["Audit Centre",auth?.user?.is_admin ? "Authenticated runtime audit history is available." : "Staff and automation action history."],
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

  function resources({resources, auth}) {
    const items = Array.isArray(resources?.resources) ? resources.resources : [];
    const counts = items.reduce((a,r)=>{ const s=(r.state||'unknown').toLowerCase(); a[s]=(a[s]||0)+1; return a; },{});
    const canControl = Boolean(auth?.user?.is_admin);
    const rows = items.map(r => `<tr data-resource-row data-state="${escapeHtml(r.state)}"><td><b>${escapeHtml(r.name)}</b></td><td><span class="resource-state ${escapeHtml(r.state)}">${escapeHtml(r.state)}</span></td><td>${r.restart_allowed ? (canControl ? `<button class="button mini danger" data-restart-resource="${escapeHtml(r.name)}">Restart</button>` : '<span class="tag good">Restart allowed</span>') : '<span class="muted">Protected</span>'}</td></tr>`).join("");
    const gate = canControl ? `<section class="panel control-note"><span class="eyebrow">AUTHENTICATED CONTROL</span><h3>Protected resource operations enabled</h3><p>Only resources allowlisted by the FiveM bridge expose a restart button. Every request is attributed to your Discord account and written to the audit trail.</p></section>` : accessPanel(auth, "Resource Control");
    return `<section class="metrics-grid compact">${card("Started", counts.started || 0)}${card("Stopped", counts.stopped || 0)}${card("Other", items.length - (counts.started||0) - (counts.stopped||0))}${card("Total", items.length)}</section><section class="panel"><div class="panel-head"><div><span class="eyebrow">FIVEM RESOURCES</span><h3>Resource Directory</h3></div><input id="resourceSearch" class="search" placeholder="Search resources…" autocomplete="off"></div>${items.length ? `<div class="table-wrap"><table><thead><tr><th>Resource</th><th>State</th><th>Remote Control</th></tr></thead><tbody id="resourceRows">${rows}</tbody></table></div>` : empty("No resource data", "Resource information will appear when the server bridge reports it.")}</section>${gate}`;
  }

  function admin({auth, status}) {
    const gate = accessPanel(auth, "Admin Centre"); if (gate) return gate;
    return `<section class="admin-hero panel"><div><span class="eyebrow">AUTHENTICATED ADMINISTRATION</span><h2>Welcome, ${escapeHtml(auth.user.display_name)}</h2><p>Your Discord account is verified for LRERS administration. Controls are executed server-side through Railway and the outbound FiveM bridge.</p></div><div class="identity-card">${auth.user.avatar_url ? `<img src="${escapeHtml(auth.user.avatar_url)}" alt="">` : ''}<div><strong>${escapeHtml(auth.user.display_name)}</strong><span>${auth.user.is_owner ? 'Bot Owner' : 'Administrator'}</span></div></div></section>
      <section class="metrics-grid compact">${card("Server", status?.online ? "Online" : "Offline")}${card("Players", `${status?.players ?? 0}/${status?.max_players ?? 0}`)}${card("Permission", auth.user.is_owner ? "Owner" : "Admin")}${card("Session", "Verified")}</section>
      <section class="grid two"><article class="panel"><div class="panel-head"><div><span class="eyebrow">IN-GAME</span><h3>Announcement</h3></div></div><form id="announceForm" class="stack-form"><label for="announceMessage">Message to all connected players</label><textarea id="announceMessage" maxlength="300" placeholder="Enter an LRERS server announcement…" required></textarea><button class="button" type="submit">Send Announcement</button></form></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">QUICK LINKS</span><h3>Operations</h3></div></div><div class="action-links"><a class="action-link" href="#/resources"><b>Resource Control</b><span>Restart allowlisted resources →</span></a><a class="action-link" href="#/audit"><b>Audit Log</b><span>Review recent administration →</span></a><a class="action-link" href="#/players"><b>Player Administration</b><span>Live roster now; moderation next →</span></a></div></article></section>`;
  }

  function audit({auth, audit}) {
    const gate = accessPanel(auth, "Audit Log"); if (gate) return gate;
    const entries = Array.isArray(audit?.entries) ? audit.entries : [];
    const rows = entries.map(e => `<tr><td>${new Date(e.created_at).toLocaleString()}</td><td><span class="audit-status ${escapeHtml(String(e.status||'').toLowerCase())}">${escapeHtml(e.status)}</span></td><td>${escapeHtml(e.category)}</td><td>${escapeHtml(e.summary)}</td><td>${escapeHtml(e.result || '—')}</td></tr>`).join("");
    return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">ADMIN HISTORY</span><h3>Runtime Audit Log</h3></div><span class="tag">${entries.length} entries</span></div>${entries.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Status</th><th>Category</th><th>Action</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty("No audit entries", "No administrative actions have been recorded during this Railway runtime.")}<p class="table-note">Audit history is currently runtime-backed and resets on Railway container replacement. Durable storage is planned.</p></section>`;
  }

  const planned = (title, description, features) => `<section class="panel"><span class="eyebrow">PLANNED MODULE</span><h2>${title}</h2><p>${description}</p><div class="feature-grid">${features.map(x=>`<div class="feature"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join("")}</div></section>`;
  const integrations = ({auth}) => planned("Integrations", "A single view of the systems connected to Local Response ERS.", [["Discord",auth?.user ? `Signed in as ${escapeHtml(auth.user.display_name)}.` : "OAuth identity and role-backed permissions."],["txAdmin","Scheduled restarts and infrastructure control."],["FiveM Bridge","Live server telemetry and action queue."],["LRERS","Characters, duty, jobs and permissions."],["VehicleSpawner","Garages, saved builds and diagnostics."],["SignalPreempt / ClearPath AI","Emergency-services traffic and AI integrations."]]);
  function settings({auth}) { const gate = accessPanel(auth, "Settings"); if (gate) return gate; return planned("Settings", "Server-scoped configuration will progressively move here instead of scattered config edits.", [["Server Metadata","Display name, capacity and connection details."],["Permissions","Discord role mappings and admin access."],["Notifications","Operational alert routing."],["Resource Policy","Remote-control allowlists."],["Website","Branding and dashboard behaviour."],["Safety","Confirmation and audit policy."]]); }

  window.LRERS_VIEWS = { overview, server, players, resources, admin, audit, integrations, settings };
})();
