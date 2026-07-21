#!/usr/bin/env bash
# certification/build-letter-edition.sh
# Builds the paginated letter edition of the Software Manual: stages the
# newest archived Inferno (g)(10) report (Appendix F) then compiles with
# tectonic. Drop new session PDFs into inferno-reports/ with their default
# dated filenames and re-run — no .tex edits needed.

set -euo pipefail
cd "$(dirname "$0")"

echo "[letter] staging newest Inferno report"
node select-inferno-report.js

echo "[letter] compiling"
# --keep-intermediates: the letter edition's .aux/.log/.out/.toc are committed
# alongside the PDF (see maintain-certification step 7)
tectonic --keep-intermediates care-commons-ehr-software-manual.tex

echo "[letter] done: care-commons-ehr-software-manual.pdf"
