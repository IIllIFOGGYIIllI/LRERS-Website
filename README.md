# LRERS Website

GitHub Pages frontend for **Local Response ERS**.

## v0.2.0

The website now includes the branded LRERS operations experience, live FiveM data, Discord OAuth sign-in UI, permission-aware admin surfaces, authenticated in-game announcements, protected allowlisted resource restarts, and the runtime audit log.

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

The public website contains no bot tokens, bridge secrets, Discord OAuth client secrets, or FiveM identifiers. Discord authorization codes are exchanged by Railway. The browser receives only an opaque LRERS session token kept in `sessionStorage` for the current browser tab.

## Discord OAuth setup

The matching LRERS Discord Bot v0.3.0 backend must be deployed. In the Discord Developer Portal add this OAuth2 redirect URL:

```text
https://lrers-discord-bot-production.up.railway.app/api/v1/auth/callback
```

Add `DISCORD_CLIENT_SECRET` to Railway. `DISCORD_CLIENT_ID`, `WEBSITE_URL`, `PUBLIC_BASE_URL`, and `DISCORD_REDIRECT_URI` may be overridden, but the current LRERS deployment has safe defaults for the existing application/domain.

Admin authorization uses `BOT_OWNER_ID`, Discord Administrator permission, or IDs from `ADMIN_ROLE_IDS`.

## Website API

`assets/js/config.js` points at:

```text
https://lrers-discord-bot-production.up.railway.app
```
