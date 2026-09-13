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

  function playerTable(status, compact = false) {
    const players = Array.isArray(status?.player_list) ? status.player_list : [];
    if (!players.length) return empty("No players online", "The server is currently empty.");
    const rows = players.map(p => `<tr><td><span class="player-id">${escapeHtml(p.id)}</span></td><td><b>${escapeHtml(p.name)}</b></td><td>${escapeHtml(p.ping)} ms</td></tr>`).join("");
    return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Player</th><th>Ping</th></tr></thead><tbody>${rows}</tbody></table></div>${compact ? "" : `<p class="table-note">Live player data refreshes automatically.</p>`}`;
  }

  function overview({status, meta}) {
    const count = `${status?.players ?? 0}/${status?.max_players ?? 0}`;
    return `
      <section class="hero panel">
        <div><span class="eyebrow">LIVE OPERATIONS</span><h2>${escapeHtml(meta?.server_name || "Local Response ERS")}</h2><p>Central status and operations dashboard for the LRERS FiveM ecosystem.</p></div>
        <div>${statusBadge(Boolean(status?.online))}</div>
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
      <section class="panel"><div class="panel-head"><div><span class="eyebrow">ROADMAP</span><h3>LRERS Operations Platform</h3></div><span class="tag">Foundation</span></div><div class="feature-grid">${[
        ["Player Administration","Lookup, moderation, notes and history."],
        ["Resource Control","Start, stop, restart and health monitoring."],
        ["Audit Centre","Durable staff and automation action history."],
        ["LRERS Characters","Character, duty, department and rank integration."],
        ["Custom Resources","VehicleSpawner, SignalPreempt, ClearPath AI and more."],
        ["Discord ↔ FiveM","Reports, announcements, role sync and tickets."]
      ].map(([a,b])=>`<div class="feature"><strong>${a}</strong><span>${b}</span></div>`).join("")}</div></section>`;
  }

  function server({status, meta}) {
    return `<section class="metrics-grid">${card("Status", status?.online ? "Online" : "Offline")}${card("Players", `${status?.players ?? 0}/${status?.max_players ?? 0}`)}${card("Uptime", status?.online ? formatDuration(status.uptime_seconds) : "—")}${card("Next Restart", restartText(status))}</section>
    <section class="grid two"><article class="panel"><div class="panel-head"><div><span class="eyebrow">SERVER DETAILS</span><h3>${escapeHtml(meta?.server_name || "Local Response ERS")}</h3></div>${statusBadge(Boolean(status?.online))}</div><dl class="detail-list"><div><dt>Game Build</dt><dd>${escapeHtml(status?.game_build || "—")}</dd></div><div><dt>Server ID</dt><dd>${escapeHtml(meta?.server_id || "—")}</dd></div><div><dt>Last Update</dt><dd>${status?.updated_at ? new Date(status.updated_at).toLocaleString() : "—"}</dd></div></dl></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">CONNECTION</span><h3>Join LRERS</h3></div></div><div class="connect-box"><label>F8 Connect Command</label><code>${escapeHtml(meta?.connect_command || "Not configured")}</code><button class="button" data-copy="${escapeHtml(meta?.connect_command || "")}">Copy</button>${meta?.browser_url ? `<a class="button secondary" href="${escapeHtml(meta.browser_url)}" target="_blank" rel="noopener">Server Listing</a>` : ""}</div></article></section>`;
  }

  function players({status}) {
    return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">LIVE ROSTER</span><h3>Players <span class="muted">${status?.players ?? 0}/${status?.max_players ?? 0}</span></h3></div>${statusBadge(Boolean(status?.online))}</div>${playerTable(status)}</section><section class="panel locked"><div class="panel-head"><div><span class="eyebrow">PLANNED</span><h3>Player Administration</h3></div><span class="tag">Discord Login Required</span></div><p>Lookup history, playtime, warnings, kicks, bans, staff notes and character data will live here once authenticated administration is enabled.</p></section>`;
  }

  function resources({resources}) {
    const items = Array.isArray(resources?.resources) ? resources.resources : [];
    const counts = items.reduce((a,r)=>{ const s=(r.state||'unknown').toLowerCase(); a[s]=(a[s]||0)+1; return a; },{});
    const rows = items.map(r => `<tr data-resource-row data-state="${escapeHtml(r.state)}"><td><b>${escapeHtml(r.name)}</b></td><td><span class="resource-state ${escapeHtml(r.state)}">${escapeHtml(r.state)}</span></td><td>${r.restart_allowed ? '<span class="tag good">Restart allowed</span>' : '<span class="muted">Protected</span>'}</td></tr>`).join("");
    return `<section class="metrics-grid compact">${card("Started", counts.started || 0)}${card("Stopped", counts.stopped || 0)}${card("Other", items.length - (counts.started||0) - (counts.stopped||0))}${card("Total", items.length)}</section><section class="panel"><div class="panel-head"><div><span class="eyebrow">FIVEM RESOURCES</span><h3>Resource Directory</h3></div><input id="resourceSearch" class="search" placeholder="Search resources…" autocomplete="off"></div>${items.length ? `<div class="table-wrap"><table><thead><tr><th>Resource</th><th>State</th><th>Remote Control</th></tr></thead><tbody id="resourceRows">${rows}</tbody></table></div>` : empty("No resource data", "Resource information will appear when the server bridge reports it.")}</section><section class="panel locked"><div class="panel-head"><div><span class="eyebrow">ADMIN CONTROL</span><h3>Start / Stop / Restart</h3></div><span class="tag">Authentication Pending</span></div><p>The website is read-only in v0.1.0. Remote actions will be enabled only after Discord OAuth, role verification and CSRF protection are implemented on the Railway backend.</p></section>`;
  }

  const planned = (title, description, features) => `<section class="panel"><span class="eyebrow">PLANNED MODULE</span><h2>${title}</h2><p>${description}</p><div class="feature-grid">${features.map(x=>`<div class="feature"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join("")}</div></section>`;
  const admin = () => planned("Admin Centre", "One authenticated control centre for day-to-day FiveM administration.", [["Players","Kick, warn, ban, notes and live lookup."],["Resources","Protected start/stop/restart actions."],["Server","Restart controls, announcements and maintenance state."],["Permissions","Discord role-backed access control."],["Reports","In-game report and ticket workflows."],["Safety","Confirmation flows and complete auditing."]]);
  const audit = () => planned("Audit Log", "Durable history for staff actions, automation and remote server operations.", [["Who","Discord account responsible for each action."],["What","Exact operation, target and result."],["When","Timestamped event history."],["Search","Filter by user, action, target or result."],["Retention","Database-backed records across Railway restarts."],["Export","Future CSV/JSON audit exports."]]);
  const integrations = () => planned("Integrations", "A single view of the systems connected to Local Response ERS.", [["txAdmin","Scheduled restarts and infrastructure control."],["FiveM Bridge","Live server telemetry and action queue."],["LRERS","Characters, duty, jobs and permissions."],["VehicleSpawner","Garages, saved builds and diagnostics."],["SignalPreempt","Traffic pre-emption status and diagnostics."],["ClearPath AI / ERS","Emergency-services and AI integrations."]]);
  const settings = () => planned("Settings", "Server-scoped configuration will be managed here instead of scattered config edits.", [["Server Metadata","Display name, capacity and connection details."],["Status Panel","Refresh intervals and presentation."],["Resource Control","Remote-action allowlists."],["Notifications","Discord destinations and alert classes."],["Permissions","Owner/admin role mapping."],["Integrations","Per-resource capabilities and toggles."]]);

  window.LRERS_VIEWS = { overview, server, players, resources, admin, audit, integrations, settings, escapeHtml, formatDuration, restartText };
})();
