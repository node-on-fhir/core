#!/bin/bash
# scripts/endpoint-smoke-test.sh
#
# CI smoke test for the security-critical endpoint layer (july-fix-now #3):
# exercises /api/rpc (unary, validation, auth-negative, auth-positive, batch,
# notification) and /baseR4/metadata against a BOOTED server, from curl —
# the re-anchored verification for issue #171 (meteortesting:mocha runs 0
# tests under the rspack build).
#
# Requirements on the server: booted in dev/TEST_RUN mode so the rpcTest.*
# fixtures (server/rpc/rpcTestFixtures.js) are registered — exactly how every
# CI test-group boots. Dependencies: curl + node (both in cimg/node).
#
# Usage:
#   ./scripts/endpoint-smoke-test.sh                    # against localhost:3000
#   BASE_URL=http://host:port ./scripts/endpoint-smoke-test.sh
#   SKIP_AUTH_POSITIVE=1 ...                            # older server without the mint fixture

set -u
BASE_URL="${BASE_URL:-http://localhost:3000}"
RPC="$BASE_URL/api/rpc"
PASS=0
FAIL=0

check() {
  local label="$1" ok="$2" detail="${3:-}"
  if [ "$ok" = "0" ]; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label ${detail:+— $detail}"
    FAIL=$((FAIL+1))
  fi
}

rpc_call() {
  # rpc_call <json-body> [extra curl args...]
  local body="$1"; shift
  curl -s -m 15 -X POST "$RPC" -H 'Content-Type: application/json' "$@" -d "$body"
}

echo "[endpoint-smoke] Target: $BASE_URL"

# 1. Discovery — public by design, proves the registry + endpoint are mounted
out=$(rpc_call '{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}')
echo "$out" | grep -q '"openrpc"'; check "rpc.discover returns an OpenRPC document" $?

# 2. Open unary echo — pipeline pass-through over HTTP
out=$(rpc_call '{"jsonrpc":"2.0","id":2,"method":"rpcTest.echo","params":{"ping":"smoke"}}')
echo "$out" | grep -q '"ping":"smoke"' && echo "$out" | grep -q '"transport":"http"'
check "rpcTest.echo round-trips params over HTTP" $?

# 3. AJV validation — good params succeed
out=$(rpc_call '{"jsonrpc":"2.0","id":3,"method":"rpcTest.sum","params":{"a":2,"b":3}}')
echo "$out" | grep -q '"result":5'; check "rpcTest.sum validates and computes (2+3=5)" $?

# 4. AJV validation — bad params rejected with -32602
out=$(rpc_call '{"jsonrpc":"2.0","id":4,"method":"rpcTest.sum","params":{"a":"nope"}}')
echo "$out" | grep -q '\-32602'; check "rpcTest.sum rejects invalid params (-32602)" $?

# 5. Auth-negative — guarded method with NO token → -32001 + HTTP 403
status=$(curl -s -m 15 -o /tmp/smoke5.json -w "%{http_code}" -X POST "$RPC" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":5,"method":"rpcTest.guarded"}')
grep -q '\-32001' /tmp/smoke5.json && [ "$status" = "403" ]
check "rpcTest.guarded rejects unauthenticated call (-32001, HTTP 403)" $? "status=$status"

# 6. Auth-negative — garbage bearer token also rejected
out=$(rpc_call '{"jsonrpc":"2.0","id":6,"method":"rpcTest.guarded"}' -H 'Authorization: Bearer not-a-real-token')
echo "$out" | grep -q '\-32001'; check "rpcTest.guarded rejects a garbage bearer token (-32001)" $?

# 7. Auth-positive — mint a real login token, guarded call succeeds
if [ "${SKIP_AUTH_POSITIVE:-0}" = "1" ]; then
  echo "  - (skipped) auth-positive leg (SKIP_AUTH_POSITIVE=1)"
else
  mint=$(rpc_call '{"jsonrpc":"2.0","id":7,"method":"rpcTest.mintLoginToken"}')
  token=$(echo "$mint" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).result.token||'')}catch(e){console.log('')}})")
  if [ -z "$token" ]; then
    check "mint login token via rpcTest.mintLoginToken" 1 "no token in: $(echo "$mint" | head -c 120)"
  else
    out=$(rpc_call '{"jsonrpc":"2.0","id":8,"method":"rpcTest.guarded"}' -H "Authorization: Bearer $token")
    echo "$out" | grep -q '"secret":true'; check "rpcTest.guarded succeeds with a minted token" $?
  fi
fi

# 8. Batch — two requests, one array response with both results
out=$(rpc_call '[{"jsonrpc":"2.0","id":9,"method":"rpcTest.sum","params":{"a":1,"b":1}},{"jsonrpc":"2.0","id":10,"method":"rpcTest.concat","params":{"first":"a","second":"b"}}]')
echo "$out" | grep -q '"result":2' && echo "$out" | grep -q '"result":"ab"'
check "batch executes both requests" $?

# 9. Notification (no id) — executed, HTTP 204, empty body
status=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X POST "$RPC" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"rpcTest.echo","params":{"fire":"forget"}}')
[ "$status" = "204" ]; check "notification returns HTTP 204" $? "status=$status"

# 10. Unknown method → -32601
out=$(rpc_call '{"jsonrpc":"2.0","id":11,"method":"rpcTest.noSuchMethod"}')
echo "$out" | grep -q '\-32601'; check "unknown method returns -32601" $?

# 11. FHIR metadata — CapabilityStatement served
out=$(curl -s -m 15 "$BASE_URL/baseR4/metadata" -H 'Accept: application/fhir+json')
echo "$out" | grep -q '"CapabilityStatement"'; check "/baseR4/metadata returns a CapabilityStatement" $?

echo "[endpoint-smoke] $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] || exit 1
