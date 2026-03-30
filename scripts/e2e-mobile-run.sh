#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$ROOT_DIR/services/api"
MOBILE_DIR="$ROOT_DIR/apps/mobile"
API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:8787}"

echo "========================================="
echo " BabyLog Mobile E2E — Maestro on iOS Sim"
echo "========================================="

# 1. Check prerequisites
for cmd in maestro xcrun node; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found. Please install it first."
    exit 1
  fi
done

# 2. Wait for API to be healthy (assume user started it separately, or start it here)
echo ""
echo "==> Checking API at $API_URL ..."
for i in $(seq 1 30); do
  if curl -sf "$API_URL/health" >/dev/null 2>&1; then
    echo "    API is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: API not reachable at $API_URL after 30s."
    echo "Start it with: cd services/api && rushx dev"
    exit 1
  fi
  sleep 1
done

# 3. Reset data and simulator state
echo ""
bash "$SCRIPT_DIR/e2e-mobile-reset.sh"

# 4. Run Maestro flows
echo ""
echo "==> Running Maestro flows ..."
maestro test "$MOBILE_DIR/.maestro/flows/"

echo ""
echo "==> All flows passed!"
