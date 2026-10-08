# LRERS Website Roadmap

## Implemented through Website v0.5.0

- Public live FiveM status / player roster / resource inventory (read-only).
- Discord OAuth and server-side admin authorization.
- Website announcements and transient audit activity.
- Discord community management: welcome/goodbye, join roles, private durable configuration.
- Generic panel drafts and explicit publishing to selected Discord channels.
- Multi-message Rules with final-page verification button, Department/Notification role panels, and editable welcome/information panels.

## Next phases

- Ticket workflows: case categories, private ticket creation, claim/close, transcripts and audit.
- Automatically generated staff listing mapped from Discord roles.
- Interactive controls/commands menu (not yet implemented; current controls template is static text).
- Additional information templates: crash fixes, vehicle count, server guide, etc.
- Improved moderation workflows and long-term persistent audit storage.

All future features should reuse the durable Discord panel configuration system, retain the txAdmin boundary for FiveM resource management, and only publish on explicit administrative request.
