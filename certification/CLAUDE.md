# CLAUDE.md — `certification/`

Guidance for working inside the ONC Health IT certification tree. This
directory holds the behavioral test suite, the curated screenshots, and the
LaTeX/PDF **Software Manual** that together document CY2026 Base EHR
certification for Care Commons / Chronicle.

For a full end-to-end refresh, use the **`/maintain-certification`** skill
(`.claude/skills/maintain-certification/SKILL.md`) — it walks the whole chain
in order. This file is the reference for *why* each piece exists and *how* it
connects.

## What lives here

| Path | Role |
|------|------|
| `tdd/base_ehr/170.315.<x>.<y>.test.js` | One behavioral Nightwatch test per in-scope criterion (record / change / access, not page-presence) |
| `tdd/base_ehr/run-base-ehr-tests.sh` | Runs the whole Base EHR suite with pass/fail tracking |
| `tdd/helpers/` | Pure-CJS helpers: `authentication-helper.js`, `selector-helper.js` (incl. `takeScreenshot`) |
| `bdd/*.feature` | Gherkin feature specs (embedded verbatim in the manual via `\lstinputlisting`). Keep ASCII-normalized: XeTeX listings silently drop glyphs above U+00FF (curly quotes, em-dashes) |
| `screenshots/` | **Curated** PNGs embedded in the manual (`\includegraphics`) |
| `manual-shared-preamble.tex` / `manual-frontmatter.tex` / `manual-content.tex` | Shared manual source (preamble sans geometry; title + Certification Status + TOC; all chapters/appendices) — edit content HERE, both editions include it |
| `care-commons-ehr-software-manual.tex` | Letter-paper paginated edition shell (build: `bash build-letter-edition.sh`) |
| `care-commons-ehr-software-manual-scroll.tex` | Scroll edition shell: one variable-height page per chapter (two-pass measure/apply via `\pdfsavepos` marks; see header comments) |
| `build-letter-edition.sh` | Letter edition builder (stages the newest Inferno report → tectonic) |
| `build-scroll-edition.sh` + `scroll-heights.js` | Scroll edition builder (stage Inferno report → tectonic pass 1 → node computes per-page heights → tectonic pass 2) |
| `inferno-reports/` | Archive of record for official Inferno (g)(10) session PDFs (summary + Detailed editions, default dated filenames). The newest **summary** is embedded as manual Appendix F |
| `select-inferno-report.js` | Picks the newest session report by filename date and stages it for Appendix F (`inferno-reports/latest-g10-summary.pdf` + `inferno-report-meta.tex`, both gitignored) |
| `care-commons-ehr-software-manual.pdf` / `-scroll.pdf` | Built artifacts (commit alongside the `.tex`; rebuild BOTH when content changes) |

The single source of truth for the exact launcher command, environment
variables, and reproducibility coordinates is the manual's **Chapter 0**
(`§ Canonical Certification Configuration`, `\label{sec:cert-config}`) — keep
it in sync with `settings/settings.honeycomb.tdd.json` and CI.

## The three things that must stay in sync

A criterion's status is asserted in **three** places. When one moves, move all
three, or the manual lies:

1. **The test** — `tdd/base_ehr/170.315.<x>.<y>.test.js` (green vs.
   `GAP(170.315.x.y)` deliberate-fail).
2. **The dashboard** — `npmPackages/reference-app/client/ReferenceAppPage.jsx`,
   `BASE_EHR_TEST_STATUS` map (`green` / `gap`).
3. **The manual** — the criterion's `\maturitylabel{...}` chapter + the
   Overview summary table Status column, rebuilt into the PDF.

## Screenshot → PDF pipeline

Screenshots in the manual are **real test-run captures**, not mock-ups. The
flow, end to end:

1. **Capture in the test.** Call the helper at the moment the screen shows the
   evidence (a populated table, a saved form) — *not* in a cleanup step, or you
   capture an empty "No Data" state:
   ```js
   const { takeScreenshot } = require('../helpers/selector-helper');
   // ...at the end of the step that has data on screen:
   takeScreenshot(browser, 'base-ehr_170.315.a.1_cpoe-medications.png', '170.315(a)(1)');
   ```
   `takeScreenshot(browser, filename, criterion)`
   (`tdd/helpers/selector-helper.js`) writes to **`tests/screenshots/<filename>`**
   (repo-root `tests/screenshots/`, not this dir) and logs a `📸` line.

2. **Naming convention** (keep it exact — the `.tex` hard-codes these):
   `base-ehr_170.315.<x>.<y>_<kebab-slug>.png`
   e.g. `base-ehr_170.315.a.5_demographics.png`.

3. **Run the test** against a live TDD server (see Chapter 0 for the launcher;
   ChromeDriver must match your Chrome — pass `CHROMEDRIVER_PATH=` if needed):
   ```bash
   CHROMEDRIVER_PATH=/path/to/chromedriver \
     npx nightwatch --config nightwatch.circle.conf.js \
     certification/tdd/base_ehr/170.315.a.1.test.js
   ```
   The PNG lands in `tests/screenshots/`.

4. **Curate into `certification/screenshots/`.** Copy the good capture across:
   ```bash
   cp tests/screenshots/base-ehr_170.315.a.1_cpoe-medications.png \
      certification/screenshots/
   ```
   Only curated, meaningful screenshots belong here — Nightwatch also dumps
   *failure* screenshots into `tests/screenshots/`; those do **not** get copied.

5. **Reference in the manual** (path is relative to `certification/`):
   ```latex
   \includegraphics[width=\textwidth]{screenshots/base-ehr_170.315.a.1_cpoe-medications.png}
   ```
   Do **not** add a `frame` key to `\includegraphics` (not a graphicx option).

6. **Rebuild the PDF** (from this directory, so relative paths resolve):
   ```bash
   cd certification && tectonic care-commons-ehr-software-manual.tex
   ```
   Verify with `pdftoppm -png -r 90 -f <page> -l <page> …` before committing.

**Pure-API criteria have no UI**, so they carry no screenshot: (g)(7), (g)(9),
(g)(10) intentionally have their "Screenshot" subsection removed (an
explanatory `%` comment marks the spot). Don't add placeholder images for them.

## Inferno report → Appendix F pipeline

The manual's Appendix F reproduces the official Inferno (g)(10) session
summary report. Refreshing it after a new test session:

1. On inferno.healthit.gov, export **both** report PDFs with their default
   filenames — they embed the session date (`… - YYYYMMDD.pdf` and
   `… - Detailed - YYYYMMDD.pdf`).
2. Drop both into `certification/inferno-reports/` and `git add` them (the
   directory is the archive of record; old sessions stay).
3. Rebuild: `bash build-letter-edition.sh` (and `build-scroll-edition.sh`).
   The build runs `select-inferno-report.js`, which picks the **newest
   summary by filename date** (mtime as fallback), stages it under the
   LaTeX-safe name `inferno-reports/latest-g10-summary.pdf`, and writes
   `inferno-report-meta.tex` so the appendix prose cites the real archived
   filenames and session date. Both staged files are gitignored.
4. Commit the updated `.pdf`s alongside the report PDFs.

Only the ~20-page summary is embedded (legibility over heft — a deliberate
choice); the Detailed edition is archived and cited by filename in the
appendix. Both editions embed the full report. In the scroll edition the
report pages ship at their native size via `\includepdf[fitpaper=true]`
bracketed by `\ScrollRawPagesOn/Off` (scroll shell): embedded pages carry no
scroll position marks, so raw-pages mode exempts them from the
measured-height override that would otherwise clip them to the 12in
unmarked-page fallback. A bare `tectonic care-commons-ehr-software-manual.tex`
still compiles without the staged files — Appendix F then shows a "report not
staged" instruction — but the committed artifact must always be built via
`build-letter-edition.sh`.

## LICENSE.md and the license audit

- **`LICENSE.md`** (repo root) is the application's outbound license:
  **AGPL-3.0** (network copyleft). It is Chronicle's *own* license, not
  imposed by any dependency. The workflow packages under `npmPackages/` are
  individually MIT (core subset Apache-2.0); `extensions/` are `UNLICENSED`
  and ship only in private builds. Do not relicense without the maintainer.
- **`LICENSE_AUDIT.md`** (repo root) is the human-readable license summary.
- **Manual Appendices D & E** (`\label{chap:sbom}`, `\label{chap:license-compliance}`)
  are the SBOM + License Compliance report, generated **data-driven from
  `package-lock.json`** — the actual certified build manifest.

**Whenever you update the `.tex`/`.pdf`, re-run the license audit and refresh
the SBOM numbers**, because dependency bumps change the counts:

```bash
# 1. License distribution straight from the lockfile (feeds Appendix D "raw"
#    table + Appendix E family counts). No install needed.
node -e '
const lock=require("./package-lock.json"),p=lock.packages||{},c={};
for(const[k,v]of Object.entries(p)){if(!k)continue;let l=v.license;
if(Array.isArray(l))l=l.map(x=>(x&&x.type)||x).join(" OR ");
if(l&&typeof l==="object")l=l.type;if(!l)continue;c[l]=(c[l]||0)+1;}
Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([l,n])=>console.log(String(n).padStart(5),l));'

# 2. Confirm every UNLICENSED entry is still first-party (npmPackages/ |
#    extensions/ | core/). A NON-workspace UNLICENSED is a compliance risk.

# 3. Human-readable summary for LICENSE_AUDIT.md
npx license-checker --summary
```

Then update, in the `.tex`: the SBOM metadata counts (total / direct / dev /
first-party / with-metadata / without), the Key Components versions, the raw
SPDX distribution table, and the Appendix E family counts. Rebuild the PDF.
The Reproducibility table (Chapter 0, `\label{sec:reproducibility}`) pins the
commit SHA + `package-lock.json` SHA-256 that the SBOM was generated from —
bump it when the lockfile changes.

## Honesty rules (non-negotiable for a certification artifact)

- **Never** report a version, count, or status you did not derive from the
  repo. The SBOM documents the *shipped* build; versions are reported
  as-resolved in the lockfile even when they differ from public-registry
  latest (pinned `overrides` + bundled Meteor runtime).
- A `GAP(...)` test that fails is a truthful punch-list entry — do not flip it
  green in the manual until the test is actually green.
- `disableOauth: true` in the TDD settings is **test-only**; never present it
  as a production posture.

## Related

- Skill: `.claude/skills/maintain-certification/SKILL.md` — the ordered refresh runbook
- Manual: `care-commons-ehr-software-manual.tex` — Chapter 0 (config/repro), Appendices D/E (SBOM/license)
- Dashboard: `npmPackages/reference-app/client/ReferenceAppPage.jsx`
- Settings/CI: `settings/settings.honeycomb.tdd.json`, `.circleci/config.yml`
- Inferno (external): https://inferno.healthit.gov — authoritative (g)(10) + API validation
