#!/bin/bash
# scripts/run-lib-tests.sh
#
# Run the fast isomorphic-lib unit tests (node --test) across every workflow
# package that has a tests/ directory. Pure-JS lib code (tracss mappers, hexgrid
# engine, …) is unit-testable with zero Meteor/browser/Mongo — this is the fast
# tier that complements the Nightwatch E2E suite (FABLE-TECH-DEBT-PAYDOWN.md § P3).
#
#   scripts/run-lib-tests.sh          # run all; exit 1 if any package fails
#
# NOTE ON NESTED REPOS: npmPackages/* and extensions/* are gitignored from the
# monorepo, so they are NOT present in a bare monorepo CI checkout — this runner
# tests whatever is on disk (everything in local dev; core/* in monorepo CI).
# Each nested-repo package also ships its own `npm test` for its own CI.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SCAN_DIRS=(npmPackages core extensions)
failed=0
ran=0

for base in "${SCAN_DIRS[@]}"; do
  [ -d "$base" ] || continue
  for dir in "$base"/*/; do
    [ -d "${dir}tests" ] || continue
    pkg="${dir%/}"
    name="$(basename "$pkg")"
    echo "── node --test: ${base}/${name} ────────────────────────────"
    if ( cd "$pkg" && node --test ); then
      echo "✔ ${name} passed"
    else
      echo "✘ ${name} FAILED"
      failed=$((failed + 1))
    fi
    ran=$((ran + 1))
    echo ""
  done
done

echo "════════════════════════════════════════════════════════════"
if [ "$ran" -eq 0 ]; then
  echo "No packages with a tests/ directory found (nothing to run)."
  exit 0
fi
if [ "$failed" -gt 0 ]; then
  echo "RESULT: ${failed}/${ran} package(s) FAILED."
  exit 1
fi
echo "RESULT: all ${ran} package(s) passed."
exit 0
