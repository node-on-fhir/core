#!/usr/bin/env bash
# scripts/verify-schema-migration.sh
# Usage: ./scripts/verify-schema-migration.sh [file.js]
#   With a file arg: verify one converted schema file.
#   Without: report repo-wide migration status.
set -e
DIR="imports/lib/schemas/SimpleSchemas"

if [ -n "$1" ]; then
  FILE="$1"
  if grep -q "new SimpleSchema" "$FILE"; then
    echo "FAIL: $FILE still contains new SimpleSchema"; exit 1
  fi
  if grep -q "simpl-schema" "$FILE"; then
    echo "FAIL: $FILE still imports simpl-schema"; exit 1
  fi
  if ! grep -q "createFhirCollection" "$FILE"; then
    echo "FAIL: $FILE does not use createFhirCollection"; exit 1
  fi
  # Syntax check (ESM-aware; node --check assumes CJS and would false-fail)
  npx --yes acorn --module --ecma2024 --silent "$FILE" && echo "OK: $FILE parses"
  exit 0
fi

# Gate on simpl-schema imports (the dependency-removal goal): 78 files have
# `new SimpleSchema` blocks; 17 more carry only the dead import; 1
# (DeviceUseStatements) has neither and just needs the factory swap.
REMAINING_BLOCKS=$(grep -rl "new SimpleSchema" $DIR | wc -l | tr -d ' ')
REMAINING_IMPORTS=$(grep -rl "simpl-schema" $DIR | wc -l | tr -d ' ')
CONVERTED=$(grep -rl "createFhirCollection" $DIR | wc -l | tr -d ' ')
TOTAL=$(ls $DIR/*.js | wc -l | tr -d ' ')
echo "converted: $CONVERTED / $TOTAL   still-SimpleSchema: $REMAINING_BLOCKS   still-importing-simpl-schema: $REMAINING_IMPORTS"
[ "$REMAINING_BLOCKS" = "0" ] && [ "$REMAINING_IMPORTS" = "0" ]
