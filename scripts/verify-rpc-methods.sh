#!/usr/bin/env bash
# scripts/verify-rpc-methods.sh [file.js]
# With file: assert the file defines no raw Meteor.methods and parses.
# Without: repo-wide status (raw blocks remaining in scope dirs) + live
# rpc.discover count when the app is running.
set -e
SCOPE="imports server npmPackages"
if [ -n "$1" ]; then
  # Match real calls, not comment mentions
  if grep -n "Meteor\.methods(" "$1" | grep -vE ':\s*(//|\*)' | grep -q .; then echo "FAIL: $1 still calls Meteor.methods"; exit 1; fi
  if ! grep -q "ServerMethods.define\|Meteor.ServerMethods.define" "$1"; then echo "WARN: $1 defines no methods (verify intentional)"; fi
  npx --yes acorn --module --ecma2024 --silent "$1" && echo "OK: $1"
  exit 0
fi
REMAINING=$(grep -rl "Meteor\.methods(" $SCOPE --include="*.js" | grep -v "imports/lib/ServerMethods.js" | grep -v "imports/accounts" | wc -l | tr -d ' ')
CALLS=$(grep -rn "Meteor\.call(\|Meteor\.callAsync(" $SCOPE --include="*.js" --include="*.jsx" | wc -l | tr -d ' ')
echo "files-with-raw-Meteor.methods: $REMAINING   remaining Meteor.call/callAsync sites: $CALLS"
DISCOVER=$(curl -s -X POST http://localhost:3000/api/rpc -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}' 2>/dev/null | grep -o '"name"' | wc -l | tr -d ' ')
[ -n "$DISCOVER" ] && echo "rpc.discover methods (app must be running): $DISCOVER"
