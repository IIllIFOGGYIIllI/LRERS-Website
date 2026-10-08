# Local Response ERS — Website

Static GitHub Pages dashboard for LRERS, with Discord OAuth through the Railway bot/API.

## Discord management

Open **Discord Management** to initialize private configuration storage and set optional welcome/goodbye and join-role settings. Open **Panel Manager** to save drafts and explicitly publish them to selected channels. The panel editor supports long-form multi-part rules, a Rules Read verification button, and separate department/notification role selection panels.

The live Discord bot must be **v0.6.0 or later**. Settings and panel message IDs are stored in the private bot configuration channel. The site never stores Discord credentials or bot tokens. Sign in with a Discord account authorized for LRERS administration.

## Deployment

Upload the changed website files to the root of your existing `LRERS-Website` repository, preserving `assets/` paths. GitHub Pages serves `index.html`. The service worker cache key increments on every release; use Ctrl+F5 after deploying if your browser retains the old interface.

## Policy

FiveM resource management remains in txAdmin. The website's resource list is informational only. Publishing does not import or overwrite the older Discord panels; select a channel deliberately and avoid posting duplicates of legacy panels until the replacement has been reviewed.

Welcome/goodbye/member join-role features require Server Members Intent enabled both in the Discord Developer Portal and in Railway (`ENABLE_MEMBER_EVENTS=true`). Verification buttons themselves do not require that intent.
