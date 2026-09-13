# Architecture

The website is deliberately a static frontend. GitHub Pages hosts HTML/CSS/JavaScript only.

Sensitive operations remain server-side on Railway. The FiveM bridge continues to make outbound authenticated requests to Railway, so the game server does not need a new inbound port.

## Security boundary

Public GitHub Pages code may call only read-only public API routes. Future administration routes will require Discord OAuth, guild membership/role validation, short-lived sessions, CSRF protection, rate limiting, action confirmation, and audit logging.
