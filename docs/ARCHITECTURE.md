# Architecture

The website remains a static GitHub Pages frontend. Sensitive operations stay server-side on Railway. The FiveM bridge makes outbound authenticated requests to Railway, so no new inbound FiveM port is required.

## Authentication boundary

Discord OAuth authorization codes are exchanged only by Railway using `DISCORD_CLIENT_SECRET`. After verification, Railway creates an opaque short-lived LRERS session and redirects the browser to GitHub Pages with a one-time exchange code. The site exchanges that code for the opaque session token and stores it in `sessionStorage`.

The browser never receives the Discord client secret, Discord access token, bot token or bridge secret.

## Authorization

Railway verifies the signed-in Discord user against the configured LRERS guild. Administration is permitted to the configured bot owner, members with Discord Administrator permission, or members holding a role in `ADMIN_ROLE_IDS`.

## Administration actions

Admin API calls are authorized server-side and enqueue the same outbound bridge actions already used by Discord slash commands. Actions are attributed to the authenticated Discord user and recorded in the bot audit framework.
