# LRERS Website

GitHub Pages operations frontend for **Local Response ERS**.

## v0.3.0

The authenticated Admin Centre is now a working operations surface rather than a placeholder. It includes:

- Discord OAuth owner/admin identity
- live FiveM server session overview
- in-game broadcast announcements
- deny-by-default resource start / stop / restart controls
- quick allowlisted-resource controls in Admin Centre
- full resource directory controls
- recent audit activity on the Admin Centre
- searchable/filterable authenticated Audit Log
- LRERS server artwork and emergency red/blue branding

## Architecture

```text
GitHub Pages (LRERS Website)
        |
        | HTTPS public + bearer-session API
        v
Railway (LRERS Discord Bot/API)
        |
        v
LRERS_DiscordBridge -> FiveM / txAdmin / LRERS resources
```

The public website contains no bot tokens, bridge secrets, Discord OAuth client secrets, or private FiveM identifiers. Discord authorization codes are exchanged by Railway. The browser receives only an opaque LRERS session token kept in `sessionStorage` for the current browser tab.

## Resource control safety

Only resources explicitly allowlisted by `LRERS_DiscordBridge` expose remote operations. `LRERS_DiscordBridge` itself remains restart-only. Every action is checked against the authenticated Discord admin session, sent through the outbound action queue, acknowledged by FiveM and recorded in the runtime audit trail.

## Discord OAuth

OAuth2 callback:

```text
https://lrers-discord-bot-production.up.railway.app/api/v1/auth/callback
```

Railway requires `DISCORD_CLIENT_SECRET`. Admin authorization uses `BOT_OWNER_ID`, Discord Administrator permission, or IDs from `ADMIN_ROLE_IDS`.

## Website API

`assets/js/config.js` points at:

```text
https://lrers-discord-bot-production.up.railway.app
```
