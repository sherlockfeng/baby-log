# BabyLog – Architecture overview

## Repo layout (Rush monorepo)

- **apps/mobile** – Expo (React Native) app; consumes API with family token.
- **services/api** – Cloudflare Worker; REST API + D1.
- **packages/shared-types** – Shared TypeScript types and DTOs for API and mobile.

## Data flow

1. User creates a family via `POST /families` → receives a **family token** (store securely).
2. All other API calls use `Authorization: Bearer <token>`.
3. Worker resolves `family_id` from token (stored hash) and scopes all reads/writes to that family.
4. Mobile app stores token in SecureStore; optional FaceID/TouchID lock (local only).

## Auth

- **Family token**: Long-lived secret; created once per family. Stored as SHA-256 hash in D1. No refresh; if lost, create a new family or use a separate recovery flow (not in v0.1).
- **App lock**: Local only; does not leave the device. Toggle in Settings.

## DB (D1)

- **families**: id, name, token_hash, created_at
- **babies**: id, family_id, name, birth_date, created_at
- **events**: id, family_id, baby_id, event_type, event_time, payload (JSON), created_at, updated_at

Indexes on (family_id, event_time) and (baby_id, event_time) for list queries.
