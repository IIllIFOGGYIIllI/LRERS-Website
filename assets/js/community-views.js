(() => {
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const gate = state => {
    if (!state.auth?.user) return `<section class="panel"><h2>Discord sign-in required</h2><p>Sign in to manage LRERS Discord.</p><button class="button discord" data-login>Sign in with Discord</button></section>`;
    if (!state.auth.user.is_admin) return `<section class="panel"><h2>Admin access required</h2><p>This section is restricted to LRERS administrators.</p></section>`;
    return '';
  };
  const options = (items, selected, blank = 'Choose…') => `<option value="">${esc(blank)}</option>${items.map(x => `<option value="${esc(x.id)}" ${String(x.id) === String(selected) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}`;
  const setup = data => (!data?.community?.configured ? `<section class="panel config-note"><h2>Discord setup required</h2><p>Create the private bot configuration channel before saving settings. Only the bot and server administrators can access it. Settings survive Railway redeploys.</p><button type="button" class="button" data-discord-setup>Initialize Discord Management</button></section>` : '');
  const status = data => data?.community?.configured ? `<span class="tag good">Configured</span>` : `<span class="tag">Setup required</span>`;
  const memberNotice = (type, data) => {
    const c = data.community[type];
    return `<form class="stack-form discord-form" data-community-message="${type}">
      <label><input type="checkbox" name="enabled" ${c.enabled ? 'checked' : ''}> Enable ${type === 'welcome' ? 'welcome' : 'goodbye'} messages</label>
      <label>Destination channel</label><select class="select" name="channel_id">${options(data.channels || [], c.channel_id, 'Choose a Discord channel')}</select>
      <label>Message (supports {mention}, {name}, {server})</label><textarea name="message" maxlength="1800" required>${esc(c.message)}</textarea>
      <button class="button" type="submit">Save ${type === 'welcome' ? 'Welcome' : 'Goodbye'}</button></form>`;
  };
  function discord(state) {
    const access = gate(state); if (access) return access;
    const d = state.community;
    if (!d) return `<section class="panel"><h2>Loading Discord configuration…</h2><p>${esc(state.communityError || 'Waiting for the bot')}</p><button class="button secondary" data-reload-discord>Retry</button></section>`;
    const memberEnabled = Boolean(d.community?.member_events_enabled);
    return `${setup(d)}<section class="panel"><div class="panel-head"><div><span class="eyebrow">DISCORD ADMINISTRATION</span><h2>Community Management</h2></div>${status(d)}</div><p>Manage welcome messages, member roles and Discord-only features. The FiveM server is not affected.</p>
      <div class="feature-grid"><div class="feature"><strong>Configuration</strong><span>${d.community.configured ? 'Discord-backed persistence active' : 'Setup not completed'}</span></div>
      <div class="feature"><strong>Member Events</strong><span>${memberEnabled ? 'Enabled' : 'Disabled — requires Server Members Intent'}</span></div>
      <div class="feature"><strong>Dedicated Panels</strong><span>${Object.keys(d.community.panels || {}).length} configured — <a href="#/panels" class="text-link">Panel Manager →</a></span></div></div></section>
      ${!memberEnabled ? `<section class="panel config-note"><h3>Member Events not enabled</h3><p>Welcome, goodbye and automatic join roles are inactive until you enable <b>Server Members Intent</b> in the Discord Developer Portal and add <code>ENABLE_MEMBER_EVENTS=true</code> to Railway, then redeploy the bot. Panel buttons work without this intent.</p></section>` : ''}
      <section class="grid two"><article class="panel"><div class="panel-head"><h3>Welcome Messages</h3></div>${memberNotice('welcome', d)}</article><article class="panel"><div class="panel-head"><h3>Goodbye Messages</h3></div>${memberNotice('goodbye', d)}</article></section>
      <section class="panel"><div class="panel-head"><h3>Automatic Member Role</h3></div><form class="stack-form" id="autoRoleForm"><label>Role assigned when a member joins LRERS</label><select class="select" name="role_id">${options((d.roles||[]).filter(r=>r.manageable), d.community.auto_role_id, 'No automatic role')}</select><button class="button" type="submit">Save Automatic Role</button></form></section>`;
  }
  const templates = [
    ['rules', 'Rules + Verification', 'Server Rules', 'verification'],
    ['welcome', 'Welcome / Introduction', 'Welcome to Local Response ERS', 'information'],
    ['department-roles', 'Department Roles', 'Choose Your Department', 'roles'],
    ['notification-roles', 'Notification Roles', 'Notification & Ping Roles', 'roles'],
    ['about-ers', 'About ERS', 'What Is ERS?', 'information'],
    ['controls', 'Controls / Commands (text)', 'Controls, Commands & Keybinds', 'information'],
    ['bugs-fixes', 'Bugs & Fixes (text)', 'Known Issues & Fixes', 'information'],
    ['vehicle-count', 'Vehicle Count (manual)', 'Server Vehicle Count', 'information']
  ];
  const roleChecklist = (roles, selected = []) => `<div class="role-checklist">${(roles||[]).filter(r=>r.manageable).map(r => `<label><input type="checkbox" name="role_ids" value="${esc(r.id)}" ${selected.map(String).includes(String(r.id)) ? 'checked' : ''}> ${esc(r.name)}</label>`).join('') || 'No safely assignable roles available — check the bot role hierarchy.'}</div>`;
  function panels(state) {
    const access=gate(state); if(access) return access;
    const d = state.community;
    if(!d) return `<section class="panel"><h2>Loading Panel Manager…</h2><p>${esc(state.communityError || 'Waiting for Discord')}</p><button class="button secondary" data-reload-discord>Retry</button></section>`;
    const panels=d.community.panels||{};
    const entries=Object.values(panels).sort((a,b)=>a.id.localeCompare(b.id));
    const chosen=panels[state.selectedPanel] || null;
    return `${setup(d)}<section class="panel"><div class="panel-head"><div><span class="eyebrow">DEDICATED DISCORD PANELS</span><h2>Panel Manager</h2></div>${status(d)}</div><p>Create approved LRERS onboarding content below. Long rules are automatically split into numbered Discord messages, and verification appears only on the final part. Republishing to the same channel updates bot-owned messages instead of creating duplicates. Existing Discord posts are not imported or changed automatically.</p></section>
      <section class="panel"><div class="panel-head"><h3>Saved Panels</h3><button class="button secondary mini" data-panel-new>New panel</button></div>${entries.length ? `<div class="panel-catalog">${entries.map(p=>`<button class="panel-choice ${state.selectedPanel === p.id ? 'selected' : ''}" data-panel-select="${esc(p.id)}"><strong>${esc(p.title)}</strong><small>${esc(p.id)} • ${esc(p.kind)} • ${p.message_id ? 'Published' : 'Draft'}</small></button>`).join('')}</div>` : `<p>No panels saved yet. Choose a starting template below.</p>`}<div class="template-list">${templates.map(([id,label])=>`<button class="button mini secondary" data-panel-template="${id}">${esc(label)}</button>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><div><span class="eyebrow">PANEL EDITOR</span><h3>${chosen ? 'Edit Panel' : 'New Panel'}</h3></div></div><form id="panelEditor" class="stack-form">
      <label>Panel ID (permanent identifier)</label><input class="search" name="panel_id" required pattern="[a-z][a-z0-9_-]{1,31}" maxlength="32" value="${esc(chosen?.id || state.panelTemplate || '')}" ${chosen?'readonly':''} placeholder="rules">
      <label>Title</label><input class="search full" name="title" required maxlength="100" value="${esc(chosen?.title || (templates.find(t=>t[0]===state.panelTemplate)?.[2]||''))}">
      <label>Panel type</label><select class="select" name="kind" id="panelKind">${['information','verification','roles'].map(k=>`<option value="${k}" ${chosen?.kind===k || (!chosen && templates.find(t=>t[0]===state.panelTemplate)?.[3]===k) ? 'selected' : ''}>${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select>
      <label>Approved panel text (up to 15,000 characters)</label><textarea name="body" maxlength="15000" required rows="13" data-panel-body placeholder="Paste the approved LRERS text. For Rules, choose the Rules Read role below.

Rules, department names, and role IDs are not guessed or imported from older messages.">${esc(chosen?.body||'')}</textarea><small data-panel-length>0 / 15,000 characters</small>
      <label>Accent colour</label><select class="select" name="color">${['blue','red','neutral'].map(k=>`<option ${chosen?.color===k?'selected':''} value="${k}">${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select>
      <label>Verification: choose exactly one safe Rules Read role. Department/notification roles: choose up to 8.</label>${roleChecklist(d.roles,chosen?.role_ids)}
      <div class="panel-preview" data-panel-preview><span class="panel-preview-label">DISCORD PANEL PREVIEW · TEXT ONLY</span><strong data-preview-title>${esc(chosen?.title || templates.find(t=>t[0]===state.panelTemplate)?.[2] || 'Panel title')}</strong><pre data-preview-body>${esc(chosen?.body || 'Your approved panel content will appear here as you type.')}</pre><small>Discord will split long text into numbered messages. Interactive buttons appear only after publishing.</small></div>
      <button type="submit" class="button">Save Panel Draft</button></form>
      ${chosen ? `<form class="stack-form publish-form" id="publishPanelForm"><h3>Publish: ${esc(chosen.title)}</h3><p>Publishing sends or updates the bot-owned message(s) in the selected Discord channel. Check the preview and destination carefully. Moving channels does not delete the old posts automatically.</p><label>Destination channel</label><select class="select" name="channel_id" required>${options(d.channels, chosen.channel_id, 'Select destination channel')}</select><button class="button" type="submit">${chosen.message_id ? 'Publish / Update Panel' : 'Publish Panel'}</button>${chosen.message_id ? `<small>Published: ${esc((chosen.message_ids || [chosen.message_id]).length)} part(s). Last message: ${esc(chosen.message_id)}</small>`:''}</form>` : ''}</section>`;
  }
  window.LRERS_COMMUNITY_VIEWS={discord,panels};
})();
