---
name: maintain-certification
description: Use when refreshing, extending, or re-syncing the ONC Base EHR certification artifacts — behavioral tests, real-test-run screenshots, the LaTeX/PDF Software Manual, the reference-app dashboard, and the SBOM/license audit. Trigger with /maintain-certification.
---

# Maintain Certification

An ordered runbook for keeping the ONC Health IT certification artifacts under
`certification/` truthful and in sync. The certification story is asserted in
several coupled places; this skill is the discipline that stops them drifting
apart. Read `certification/CLAUDE.md` first — it holds the mechanics; this
skill holds the *order of operations*.

Everything here must be **data-driven and honest**: never report a status,
version, or count you did not derive from the repo. This is a certification
artifact — a fabricated number is worse than a missing one.

## When to use

- A criterion moved from gap → green (or regressed) and the docs must follow.
- You added or improved a behavioral test and want a real screenshot in the PDF.
- Dependencies changed (`npm install`, a Dependabot bump, an `overrides` edit)
  and the SBOM / license audit must be regenerated.
- Any edit to `care-commons-ehr-software-manual.tex` before committing the PDF.

## The coupled artifacts (know these before editing)

| # | Artifact | What it asserts |
|---|----------|-----------------|
| 1 | `certification/tdd/base_ehr/170.315.<x>.<y>.test.js` | The behavioral truth (green / `GAP(...)`) |
| 2 | `npmPackages/reference-app/client/ReferenceAppPage.jsx` (`BASE_EHR_TEST_STATUS`) | The in-app dashboard |
| 3 | `certification/care-commons-ehr-software-manual.tex` (`\maturitylabel` + Overview table) | The manual's per-criterion status |
| 4 | `certification/screenshots/*.png` → `\includegraphics` | Visual evidence |
| 5 | Manual Appendices D/E + `LICENSE_AUDIT.md` | SBOM + license compliance |
| 6 | Chapter 0 `\label{sec:reproducibility}` | Commit SHA + lockfile hash the SBOM came from |

## Runbook

Create a todo per checklist item you actually touch; skip sections that don't apply.

### 1. Establish ground truth (tests)
- Run the affected criteria against a live TDD server. Launcher + env are in
  the manual's Chapter 0 (`\label{sec:cert-config}`); ChromeDriver must match
  Chrome (`CHROMEDRIVER_PATH=` if not).
  ```bash
  CHROMEDRIVER_PATH=/path/to/chromedriver \
    npx nightwatch --config nightwatch.circle.conf.js \
    certification/tdd/base_ehr/170.315.<x>.<y>.test.js
  ```
- Record the real outcome per criterion (green / red). This is the ONLY source
  of a status change. Do not edit docs ahead of the test.

### 2. Screenshots (only for UI criteria)
- Ensure the test calls `takeScreenshot(browser, 'base-ehr_170.315.<x>.<y>_<slug>.png', '170.315(<x>)(<y>)')`
  at the step where the evidence is **on screen** (not in cleanup — that
  captures "No Data").
- After the run, copy the good PNG from `tests/screenshots/` into
  `certification/screenshots/`.
- Reference it in the `.tex`:
  `\includegraphics[width=\textwidth]{screenshots/base-ehr_170.315.<x>.<y>_<slug>.png}`
- Pure-API criteria ((g)(7), (g)(9), (g)(10)) get **no** screenshot — leave the
  removed-section `%` comment in place.
- Full mechanics: `certification/CLAUDE.md` § Screenshot → PDF pipeline.

### 3. Re-run the license audit + refresh the SBOM
Run this whenever the lockfile changed OR you're touching the manual anyway:
```bash
# License distribution from the lockfile (Appendix D raw table + Appendix E counts)
node -e '
const lock=require("./package-lock.json"),p=lock.packages||{},c={};
for(const[k,v]of Object.entries(p)){if(!k)continue;let l=v.license;
if(Array.isArray(l))l=l.map(x=>(x&&x.type)||x).join(" OR ");
if(l&&typeof l==="object")l=l.type;if(!l)continue;c[l]=(c[l]||0)+1;}
Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([l,n])=>console.log(String(n).padStart(5),l));'

# Counts for the SBOM metadata block
node -e '
const lock=require("./package-lock.json"),p=lock.packages||{};
const keys=Object.keys(p).filter(k=>k);
const pk=require("./package.json");
console.log("total resolved:",keys.length);
console.log("direct runtime:",Object.keys(pk.dependencies||{}).length);
console.log("direct dev:",Object.keys(pk.devDependencies||{}).length);'
```
- Verify every `UNLICENSED` entry is still first-party (resolves to
  `npmPackages/` | `extensions/` | `core/`). A non-workspace `UNLICENSED` is a
  real compliance risk — surface it, do not bury it.
- Update in the `.tex`: SBOM metadata counts, Key Components versions, the raw
  SPDX distribution table, and the Appendix E family counts.
- Refresh `LICENSE_AUDIT.md` (`npx license-checker --summary`) if it moved.
- `LICENSE.md` = AGPL-3.0 (app's own outbound license). Note it; never
  relicense without the maintainer.

### 4. Sync the status trio
For each criterion whose status changed, update **all three**:
- the test (already done in step 1),
- `ReferenceAppPage.jsx` `BASE_EHR_TEST_STATUS` (`green`/`gap`),
- the manual: the chapter `\maturitylabel{verified|gap|...}` **and** the
  Overview summary-table Status column **and** the "N verified / M gap" prose.

### 5. Update the reproducibility coordinates
If the lockfile or commit changed, refresh Chapter 0
`\label{sec:reproducibility}`: commit SHA, `package-lock.json` SHA-256
(`shasum -a 256 package-lock.json`), Node / npm / Meteor / MongoDB versions.

### 6. Rebuild + verify the PDF
```bash
cd certification && bash build-letter-edition.sh   # stages newest Inferno report, then tectonic
cd certification && bash build-scroll-edition.sh   # scroll edition (Appendix F renders a pointer)
```
- The letter build first runs `select-inferno-report.js`, which stages the
  newest session PDF from `certification/inferno-reports/` into Appendix F.
  New Inferno results: export both PDFs from inferno.healthit.gov with their
  default (session-dated) filenames, drop them in `inferno-reports/`, commit
  them, rebuild — no `.tex` edits.
- Exit 0 expected; underfull/overfull `\hbox` warnings are cosmetic.
- **Always** spot-check rendering before committing:
  ```bash
  pdftoppm -png -r 90 -f <page> -l <page> care-commons-ehr-software-manual.pdf /tmp/verify
  ```
  Read the PNG. Confirm: `§` renders (not `ğ`), tables span, images embed,
  chapter/appendix numbering is right.

### 7. Commit
Stage the `.tex`, `.pdf`, and LaTeX intermediates together so the source and
artifact never diverge:
```bash
git add certification/care-commons-ehr-software-manual.{tex,pdf,aux,log,out,toc} \
        certification/care-commons-ehr-software-manual-scroll.pdf \
        certification/inferno-reports/ \
        certification/screenshots/ certification/tdd/ \
        npmPackages/reference-app/client/ReferenceAppPage.jsx LICENSE_AUDIT.md
```
Write a commit message that states what changed factually (which criteria,
which counts). Commit/push only when the user has asked; branch first if on
the default branch.

## Guardrails

- Test truth leads; docs follow. Never flip a `GAP(...)` green in the manual
  before the test is actually green.
- SBOM versions are reported **as-resolved in the lockfile** — the shipped
  build — even when they differ from public-registry latest.
- `disableOauth: true` (TDD settings) is test-only; never document it as
  production.
- (g)(10) and the authoritative API validation of (g)(7)/(g)(9) are external
  (Inferno, https://inferno.healthit.gov); the Nightwatch suite is
  development/CI verification, not a substitute — keep that caveat intact.

## Related

- `certification/CLAUDE.md` — mechanics of every step above
- Manual Chapter 0 — canonical config + reproducibility
- Manual Appendices D/E — SBOM + license compliance
