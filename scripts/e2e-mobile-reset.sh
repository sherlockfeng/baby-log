#!/usr/bin/env bash
set -euo pipefail

API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:8787}"

echo "==> Resetting e2e database at $API_URL ..."
curl -sf -X POST "$API_URL/e2e/reset" -H "Content-Type: application/json" -d '{}' | jq .

echo "==> Clearing iOS Simulator SecureStore for Expo Go ..."
BOOTED_UDID=$(xcrun simctl list devices booted -j 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
for rt in d.get('devices',{}).values():
  for dev in rt:
    if dev.get('state')=='Booted':
      print(dev['udid']); sys.exit(0)
" 2>/dev/null || true)

if [ -n "${BOOTED_UDID:-}" ]; then
  echo "    Simulator UDID: $BOOTED_UDID"
  KEYCHAIN_DIR="$HOME/Library/Developer/CoreSimulator/Devices/$BOOTED_UDID/data/Library/Keychains"
  if [ -d "$KEYCHAIN_DIR" ]; then
    echo "    Removing keychain data to clear SecureStore ..."
    rm -rf "$KEYCHAIN_DIR"
    echo "    Done. App will see empty SecureStore on next launch."
  else
    echo "    No keychain dir found — SecureStore likely already clean."
  fi
else
  echo "    No booted simulator found — skipping SecureStore cleanup."
fi

echo "==> Reset complete."
