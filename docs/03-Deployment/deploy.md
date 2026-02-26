# BabyLog – Deployment

## Prerequisites

- Node.js 18+
- pnpm 9.x
- Rush: `npm install -g @microsoft/rush`
- Cloudflare account (for Workers + D1)

## One-time setup

### 1. Clone and install

```bash
git clone <repo>
cd baby-log
rush update
```

### 2. Create D1 database

```bash
cd services/api
npx wrangler login
npx wrangler d1 create babylog
```

Copy the `database_id` from the output and set it in `services/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "babylog"
database_id = "<YOUR_DB_ID>"
```

### 3. Apply migrations

```bash
# Local (for wrangler dev)
npx wrangler d1 migrations apply babylog --local

# Remote (for deploy)
npx wrangler d1 migrations apply babylog
```

## Local development

- **API**: `cd services/api && rushx dev` → http://localhost:8787
- **Mobile**: `cd apps/mobile && rushx start` → Expo dev server; use iOS/Android simulator or Expo Go

Set `EXPO_PUBLIC_API_URL` to your local API URL if different (e.g. machine IP for device).

## Deploy API to Cloudflare

```bash
cd services/api
rushx deploy
```

After first deploy, set the Worker URL in the mobile app (e.g. `EXPO_PUBLIC_API_URL=https://babylog-api.<your-subdomain>.workers.dev`).
