#!/bin/bash
# scripts/audit-package-repos.sh
#
# Package repository drift auditor (FABLE-TECH-DEBT-PAYDOWN.md § P2 registry).
#
# Each package under packages/, npmPackages/, core/, and extensions/ is either
# tracked by the monorepo or carries its own nested git repository. This script
# classifies every package and flags the drift that caused real incidents
# (FABLE-ANALYSIS.md §4): packages in NO repository, packages double-homed in
# both the monorepo AND a nested repo, nested repos with no remote, and nested
# repos with uncommitted or unpushed work.
#
# Usage:
#   scripts/audit-package-repos.sh            # human-readable table
#   scripts/audit-package-repos.sh --tsv      # tab-separated (for piping)
#   scripts/audit-package-repos.sh --problems # only rows with a flag
#
# Exit code: 0 if no drift flags, 1 if any package is flagged.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SCAN_DIRS=(packages npmPackages core extensions)
MODE="table"
case "${1:-}" in
  --tsv) MODE="tsv" ;;
  --problems) MODE="problems" ;;
  "" ) ;;
  *) echo "Unknown option: $1" >&2; exit 2 ;;
esac

flagged=0
rows=()

for base in "${SCAN_DIRS[@]}"; do
  [ -d "$base" ] || continue
  for dir in "$base"/*/; do
    [ -d "$dir" ] || continue
    pkg="${dir%/}"
    name="$(basename "$pkg")"

    # Is this path tracked by the monorepo (force-added past .gitignore)?
    monorepo_tracked="no"
    if [ -n "$(git ls-files "$pkg" 2>/dev/null | head -1)" ]; then
      monorepo_tracked="yes"
    fi

    # Does the package carry its own nested git repo? (.git dir or gitlink file)
    nested_repo="no"
    if [ -e "$pkg/.git" ]; then
      nested_repo="yes"
    fi

    posture="—"
    remote=""
    drift=""

    if [ "$nested_repo" = "yes" ]; then
      posture="nested"
      remote="$(git -C "$pkg" remote get-url origin 2>/dev/null || echo "")"
      if [ -z "$remote" ]; then
        drift="${drift}no-remote;"
      fi
      # Uncommitted changes in the nested repo?
      if [ -n "$(git -C "$pkg" status --porcelain 2>/dev/null)" ]; then
        drift="${drift}uncommitted;"
      fi
      # Unpushed commits (ahead of upstream)?
      upstream="$(git -C "$pkg" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")"
      if [ -n "$upstream" ]; then
        ahead="$(git -C "$pkg" rev-list --count '@{u}'..HEAD 2>/dev/null || echo 0)"
        [ "${ahead:-0}" -gt 0 ] && drift="${drift}unpushed(${ahead});"
      elif [ -n "$remote" ]; then
        drift="${drift}no-upstream;"
      fi
      # Double-homed: both monorepo-tracked AND a nested repo.
      if [ "$monorepo_tracked" = "yes" ]; then
        drift="${drift}double-homed;"
        posture="nested+tracked"
      fi
    elif [ "$monorepo_tracked" = "yes" ]; then
      posture="tracked"
    else
      # In no repository at all — the §4 incident class.
      posture="orphan"
      drift="${drift}NO-REPOSITORY;"
    fi

    [ -z "$drift" ] && drift="ok" || flagged=$((flagged + 1))

    rows+=("${base}/${name}	${posture}	${remote:-—}	${drift}")
  done
done

print_row() { printf '%-42s %-16s %-12s %s\n' "$1" "$2" "$3" "$4"; }

case "$MODE" in
  tsv)
    printf 'package\tposture\tremote\tflags\n'
    for r in "${rows[@]}"; do printf '%s\n' "$r"; done
    ;;
  problems)
    print_row "PACKAGE" "POSTURE" "REMOTE" "FLAGS"
    print_row "-------" "-------" "------" "-----"
    for r in "${rows[@]}"; do
      IFS=$'\t' read -r c1 c2 c3 c4 <<< "$r"
      [ "$c4" != "ok" ] && print_row "$c1" "$c2" "${c3:0:12}" "$c4"
    done
    ;;
  *)
    print_row "PACKAGE" "POSTURE" "REMOTE" "FLAGS"
    print_row "-------" "-------" "------" "-----"
    for r in "${rows[@]}"; do
      IFS=$'\t' read -r c1 c2 c3 c4 <<< "$r"
      print_row "$c1" "$c2" "${c3:0:12}" "$c4"
    done
    ;;
esac

echo ""
echo "Scanned ${#rows[@]} packages across: ${SCAN_DIRS[*]}"
if [ "$flagged" -gt 0 ]; then
  echo "DRIFT: ${flagged} package(s) flagged. See FLAGS column."
  exit 1
else
  echo "Clean: no drift flags."
  exit 0
fi
