#!/usr/bin/env bash
# Post-deploy smoke — RELEASE_CHECKLIST §9 / PR1 launch day.
# Usage: BASE=https://himbean.coffee ./scripts/smoke.sh
set -euo pipefail
BASE="${BASE:-http://localhost:3000}"
fail() { echo "SMOKE FAIL: $1"; exit 1; }

echo "→ health"
curl -sf "$BASE/api/health" | grep -q '"status":"ok"' || fail "health not ok"

echo "→ home renders"
curl -sf "$BASE/" | grep -qi "himbean" || fail "home missing brand"

echo "→ menu renders"
curl -sf "$BASE/menu" | grep -qi "menu" || fail "menu page"

echo "→ locations api"
curl -sf "$BASE/api/locations" | grep -q '"locations"' || fail "locations api"

echo "→ ops routes gated (expect redirect/deny when anonymous)"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/pos/orders")
[ "$code" = "403" ] || [ "$code" = "401" ] || fail "POS api not gated (got $code)"

echo "→ order validation rejects garbage"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/orders" -H "Content-Type: application/json" -d '{}')
[ "$code" = "400" ] || fail "order validation (got $code)"

echo "SMOKE PASS — proceed to the manual E2E order (checklist §0)."
