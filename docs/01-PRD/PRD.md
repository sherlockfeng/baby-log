# BabyLog – Product Requirements (v0.1)

## Goal

Build a **private family baby logging system** with multi-device sync.

## Stack

- **Monorepo**: Rush + pnpm
- **Mobile**: Expo (React Native) + TypeScript
- **Backend**: Cloudflare Workers + TypeScript
- **DB**: Cloudflare D1 (SQLite)
- **Auth**: Family Token (Bearer) for sync
- **App Lock**: FaceID / TouchID (local only)

## Scope (v0.1)

- One family per token; families can have multiple babies.
- Events: feed, poop, weight, vaccine, sleep, diaper, solid.
- Mobile app: setup (paste or create family token), quick add events, timeline, settings (FaceID lock, add baby).
- API: REST with Bearer token; CRUD for babies and events; optional stats stubs.

## Out of scope (v0.1)

- Multi-tenant or public discovery.
- Real-time push.
- Rich stats (v0.1 stats are stubs).
- Web app (mobile-first).
