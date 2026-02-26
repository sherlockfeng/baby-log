# BabyLog API – curl examples

Base URL for local dev: `http://localhost:8787`. Start the API with:

```bash
cd services/api && rushx dev
```

## 1. Health check (no auth)

```bash
curl -s http://localhost:8787/health
# {"ok":true}
```

## 2. Create family (get token)

```bash
curl -s -X POST http://localhost:8787/families \
  -H "Content-Type: application/json" \
  -d '{"name":"My Family"}'
# {"familyId":"...","token":"...","name":"My Family"}
```

Save the `token` from the response; use it as `Authorization: Bearer <token>` for all other requests.

Example (replace `YOUR_TOKEN`):

```bash
export TOKEN="YOUR_TOKEN"
```

## 3. Create baby

```bash
curl -s -X POST http://localhost:8787/babies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Baby","birthDate":"2024-01-15"}'
# {"id":"...","familyId":"...","name":"Baby","birthDate":"2024-01-15","createdAt":"..."}
```

Save the baby `id` for creating events (e.g. `BABY_ID`).

## 4. List babies

```bash
curl -s http://localhost:8787/babies \
  -H "Authorization: Bearer $TOKEN"
# [{"id":"...","familyId":"...","name":"Baby","birthDate":"2024-01-15","createdAt":"..."}]
```

## 5. Create event (idempotent on id)

```bash
curl -s -X POST http://localhost:8787/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id":"evt-001",
    "babyId":"'$BABY_ID'",
    "eventType":"feed",
    "eventTime":"2024-11-01T10:00:00.000Z",
    "payload":{"amountMl":120,"method":"bottle","note":"morning"}
  }'
```

## 6. List events

```bash
# All events
curl -s "http://localhost:8787/events?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Filter by baby and type
curl -s "http://localhost:8787/events?babyId=$BABY_ID&type=feed&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## 7. Full flow (one-liner style)

```bash
# Create family and parse token (requires jq)
RES=$(curl -s -X POST http://localhost:8787/families -H "Content-Type: application/json" -d '{}')
TOKEN=$(echo $RES | jq -r '.token')
# Create baby
BABY=$(curl -s -X POST http://localhost:8787/babies -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Test","birthDate":"2024-01-01"}')
BABY_ID=$(echo $BABY | jq -r '.id')
# Create event
curl -s -X POST http://localhost:8787/events -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"id\":\"evt-1\",\"babyId\":\"$BABY_ID\",\"eventType\":\"feed\",\"eventTime\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"payload\":{\"amountMl\":100}}"
# List events
curl -s "http://localhost:8787/events" -H "Authorization: Bearer $TOKEN" | jq .
```
