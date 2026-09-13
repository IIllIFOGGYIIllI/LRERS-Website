# LRERS Website

GitHub Pages frontend for **Local Response ERS**.

## v0.1.0

The first website foundation includes:

- Live server Overview
- FiveM server status and connection details
- Current player roster
- Live resource directory with search
- PWA/installable web-app foundation
- Planned Admin Centre, Audit, Integrations and Settings sections
- Railway API integration with no secrets stored in the frontend

## Architecture

```text
GitHub Pages (LRERS Website)
        |
        | HTTPS read-only API
        v
Railway (LRERS Discord Bot/API)
        |
        v
LRERS_DiscordBridge -> FiveM / txAdmin / LRERS resources
```

The public website must never contain `DISCORD_TOKEN`, `BRIDGE_SECRET`, admin credentials, or other server secrets. Administrative website actions will be added later through authenticated Railway API routes using Discord OAuth and server-side role checks.

## GitHub Pages

1. Create a repository named `LRERS-Website`.
2. Upload all files from this package to the repository root.
3. Open **Settings -> Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

The site uses hash routing, so it works correctly from a GitHub Pages repository sub-path.

## API

`assets/js/config.js` points to the existing Railway service:

```text
https://lrers-discord-bot-production.up.railway.app
```

The matching Discord Bot v0.2.5 backend update adds the public read-only endpoints required by this site.
