#!/usr/bin/env bash
# certification/build-scroll-edition.sh
# Builds the scroll edition of the Software Manual (one variable-height page
# per chapter) via the two-pass scheme documented in
# care-commons-ehr-software-manual-scroll.tex.

set -euo pipefail
cd "$(dirname "$0")"

SHELL_TEX=care-commons-ehr-software-manual-scroll

echo "[scroll] pass 1: measuring content on uniform 199in pages"
rm -f scroll-heights.tex
tectonic --keep-intermediates "${SHELL_TEX}.tex"

echo "[scroll] computing per-page heights"
node scroll-heights.js "${SHELL_TEX}.aux" > scroll-heights.tex

echo "[scroll] pass 2: applying exact scroll heights"
tectonic --keep-intermediates "${SHELL_TEX}.tex"

echo "[scroll] cleaning intermediates"
rm -f "${SHELL_TEX}".{aux,log,toc,out,xdv} scroll-heights.tex

echo "[scroll] done: ${SHELL_TEX}.pdf"
