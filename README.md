# BabyLog

Private family baby logging system with multi-device sync.

## Stack

- **Monorepo**: Rush + pnpm
- **Mobile**: Expo (React Native) + TypeScript
- **Backend**: Cloudflare Workers + TypeScript
- **DB**: Cloudflare D1 (SQLite)
- **Auth**: Family Token (Bearer) for sync
- **App Lock**: FaceID/TouchID (local only)

## Development

### Prerequisites

- Node.js 18+
- pnpm 9.x
- Rush: `npm install -g @microsoft/rush`
- Cloudflare account (for D1; optional for local-only API)

### Setup

```bash
rush update
```

### API (Cloudflare Workers)

1. (Optional) Create D1 and set `database_id` in `services/api/wrangler.toml` (see [docs/03-Deployment/deploy.md](docs/03-Deployment/deploy.md)).
2. Apply migrations: `cd services/api && npx wrangler d1 migrations apply babylog --local`
3. Start dev server:

```bash
cd services/api
rushx dev
```

API runs at http://localhost:8787. See [docs/04-API/](docs/04-API/) for OpenAPI spec and curl examples.

### Mobile (Expo)

```bash
cd apps/mobile
rushx start
```

Then press `i` for iOS or `a` for Android. Set `EXPO_PUBLIC_API_URL` if the API is not at `http://localhost:8787` (e.g. your machine IP when using a physical device).

## Docs

- [PRD](docs/01-PRD/PRD.md)
- [Architecture](docs/02-Architecture/overview.md)
- [Deployment](docs/03-Deployment/deploy.md)
- [API (OpenAPI + curl)](docs/04-API/)

## License

MIT
