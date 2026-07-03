# PACIO Connectathon Testing Guide

Hands-on instructions for exercising the PACIO track features — where things
are in the UI, what to click, what you should see, and console fallbacks when
you want to drive things directly. Companion to
[`CONNECTATHON-READINESS.md`](CONNECTATHON-READINESS.md) (verified results).

## 1. Start the app

```bash
OPENAI_API_KEY=<key> GOOGLE_MAPS_API_KEY=<key> \
EXTRA_WORKFLOWS=@node-on-fhir/pacio-core,@node-on-fhir/quality-measures,@node-on-fhir/structured-data-capture,@node-on-fhir/secure-messaging,@node-on-fhir/us-core,@node-on-fhir/admin-tools,@node-on-fhir/international-patient-summary,@node-on-fhir/data-importer,@node-on-fhir/data-exporter,@node-on-fhir/radiology-workflow,@orbital/timelines,@orbital/fhir-graph,@orbital/mcp,@orbital/email-list \
meteor run --settings npmPackages/pacio-core/configs/settings.pacio-core.2026.json
```

Migrated to NPM workflow packages (2026-06-14): everything loads via
**`EXTRA_WORKFLOWS`** now — the old Atmosphere `--extra-packages "clinical:…"`
form is dead (those packages are in `deprecated/`). The `OPENAI_API_KEY` /
`GOOGLE_MAPS_API_KEY` env vars are optional (maps/AI features). Watch the boot
log for these lines — they confirm both packages initialized:

```
PACIO Core package server initialized
[quality-measures.startup] Seeded 5 CMS1317 value sets
[quality-measures.startup] Seeded 2 of 2 PACIO measures
```

Alternative for test automation: `npm run medical-home-autologin` (auto-login
as `demouser` / `password2025`, autopublish on — fewer subscription
surprises, but uses the TDD settings file, not the 2026 theme).

## 2. Log in

Register/login via the account UI (top right), or in the browser console:

```js
Meteor.call('test.createTestUser', { username: 'janedoe', email: 'janedoe@test.org', password: 'janedoe123' },
  () => Meteor.loginWithPassword('janedoe', 'janedoe123', console.log));
```

Most pages and all server methods require a logged-in user.

## 3. Load the Connectathon data (do this first)

**UI:** look at the **footer bar** at the bottom of the page — click
**“Load Connectathon Data”** (teal button, id
`pacio-core-load-connectathon-data-footer-btn`). A dialog reports
`Loaded 505 resources with 0 errors`.

**Console fallback:**

```js
Meteor.call('pacio.loadConnectathonData', (e, r) => console.log(e || r));
```

This loads the official PACIO sample-data depot (personas **Betsy
Smith-Johnson**, **Violet Gartner**, **Wilma Marina**) plus the curated BSJ
demo fixtures (inpatient encounter, ADI document, Z66 condition + DNR
ServiceRequest, ACP-discussion observation, fully-conformant ToC
composition, PROMIS-10 response). Idempotent — safe to click again.

## 4. UI map

| Route | What it is |
|---|---|
| `/` | Facility dashboard (bed board, 16 beds) |
| `/advance-directives` | Advance directives list (ADI documents) |
| `/advance-directive/:id` | Directive detail — view/download PDF, revoke |
| `/transition-of-care` | ToC documents list + document builder |
| `/transition-of-care/:id` | ToC composition detail, Bundle export |
| `/pfe-assessments` | PFE assessment list |
| `/pfe-assessment/new` | Take a PROMIS-10 assessment |
| `/pfe-data-exchange` | PFE HIE exchange simulation |
| `/medication-management` | Medication lists |
| `/patient-fetch` | Import a patient from an external FHIR server |
| `/quality-measures` | **Quality measures: list, calculate, results** |
| `/pacio-exam-room` | Single-room monitor view |

Sidebar (hamburger, top left) carries the workflow entries (Facility
Dashboard, Patient Fetch, Advance Directives, Continuity of Care, Medication
Management, Take Vital Signs, Structured Data Capture, Quality Measures).
The **footer bar** carries context buttons — `Sync Patient Record`,
`Load Connectathon Data`.

## 5. Walkthrough: Quality Measures (Scenario 1)

1. Navigate to **/quality-measures** (sidebar → Quality Measures).
2. **Measures tab** → select **CMS1317v1: Advance Care Planning (PACIO FHIR
   mapping)**.
3. ⚠️ **Set the measurement period to 2026-01-01 → 2026-12-31** (the date
   pickers default to 2024 — Betsy's encounter is in 2026; a 2024 period
   yields an honest zero).
4. Report type **Individual** → pick **Betsy Smith-Johnson** from the
   patient list. (If the patient list is empty, the client hasn't received
   patients into minimongo yet — visit the facility dashboard first to warm
   subscriptions, or use the console fallback below.)
5. Click **Calculate**. Expected: population waterfall IP=1 → Denominator=1
   → Numerator=1, score 100%, and the **measure detail card** shows the
   three numerator paths:
   - ✅ 1. ACP Document (via her ADI DocumentReference — PACIO reading)
   - ✅ 2. ACP Discussion (LOINC 75773-2 observation)
   - ✅ 3. DNR Order (Z66 ServiceRequest — faithful reading)
6. Repeat with **PACIO-ICARE-v1**: expect the 15-section ToC checklist all
   green.
7. Negative check: select a CMS measure (e.g. CMS2v13) → Calculate → expect
   a clean **"not found / not computable"** error, not invented numbers.

**Console fallback / scripted version:**

```js
Meteor.call('qualityMeasures.calculate', {
  measureId: 'CMS1317v1', periodStart: '2026-01-01', periodEnd: '2026-12-31',
  reportType: 'individual', patientId: 'bsj-patient-001'
}, (e, r) => console.log(e || r.evaluationResult.details.numeratorPaths));
```

Look for `acpDocument: { met: true, faithfulMet: false }` — that single line
is the differential finding (faithful QDM→FHIR mapping misses PACIO
DocumentReferences).

## 6. Walkthrough: ADI Provenance (breakout demo)

1. **/advance-directives** → open Betsy's advance directive.
2. Click **View PDF** or **Download** → records a retrieval `AuditEvent`
   (who retrieved).
3. Opening the list itself records a search `AuditEvent` (who queried).
4. Create a new directive (New Directive → type POLST → save) → an
   `ADI-Provenance` with activity **CREATE** and author + custodian agents.
5. Revoke it (detail page → Revoke, give a reason) → Provenance activity
   **NULLIFY**; the directive shows status *entered-in-error*.

Verify the trail in the browser console:

```js
Meteor.subscribe('pacio.recentUpdates');
// or inspect server-side via meteor shell / mongo:
//   db.Provenances.find({'meta.profile':'http://hl7.org/fhir/us/pacio-adi/StructureDefinition/ADI-Provenance'})
//   db.AuditEvents.find({}, {sort: {recorded: -1}})
```

## 7. Walkthrough: ToC + PFE (Scenarios 3 & 2)

- **/transition-of-care** → open *Transfer Summary for Betsy Smith-Johnson*
  → all 15 required sections present → **Export Bundle** produces a
  TOC-Bundle-stamped document bundle.
- **/pfe-assessment/new** → complete a PROMIS-10 → submit → per-item PFE
  observations + a collection observation with physical/mental score
  components appear (check `/pfe-assessments`).

## 8. FHIR API spot-checks

```bash
curl -s http://localhost:3000/baseR4/metadata | jq '.rest[0].resource[] | select(.type=="DocumentReference" or .type=="Provenance") | {type, supportedProfile}'
curl -s "http://localhost:3000/baseR4/DocumentReference?patient=bsj-patient-001" | jq '.total'
```

The CapabilityStatement should advertise the ADI + ToC profiles
(ProfileSet in `server/index.js`). Point the **Inferno test kits** at
`http://localhost:3000/baseR4` using `certification/inferno.config.json`.

## 9. Automated tests

```bash
# Unit (pure measure helpers)
meteor test-packages ./packages/quality-measures

# E2E (Nightwatch — app must be running, e.g. npm run medical-home-autologin)
#   packages/quality-measures/tests/nightwatch/pacio-measures.test.js
#   packages/pacio-core/tests/nightwatch/170.315.*.test.js
npm run nightwatch
```

## 10. Switching between builds (PACIO ↔ Voyager ↔ others)

This monorepo runs as different "builds" — same code, different
`--extra-packages` selection + settings file (e.g., the PACIO Connectathon
build vs the Voyager build). **Switching builds on the same port with a
browser session still open produces garbage**: the browser keeps cached
assets and a live HMR session from the previous build and blends them with
the new server's assets. Symptoms (all four observed together on
2026-06-12, diagnosed as one root cause):

- `Cannot find module './client/components/...'` for files that exist
- `<PackageExport> is undefined` in `global-imports.js`
- `meteorInstall is not defined` in `app.js`
- `require is not a function` inside the rspack chunk (the chunk's
  `react`/`meteor/*` externals resolve through the classic runtime, which
  isn't established on a mixed page)

A diagnostic tell: script hashes in the console match the *previous*
build's bundle while the rspack chunk content belongs to the new one.

**The strongest contamination mechanism — orphaned rspack dev servers:**
the modern client chunk (`/__rspack__/client-rspack.js`) is served by a
separate rspack dev server on **port 8080**. If a meteor run dies uncleanly
(crash, SIGKILL, `_build/` invalidated by a concurrent `meteor npm install`),
the `rspack-node` child can orphan and **keep serving the OLD build's chunk
on 8080** — so the next build's pages execute the previous build's modern
code, and this survives hard refreshes. Check and clear with:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN     # an orphaned 'rspack-node' (PPID 1)?
kill <pid>
```

Related: don't run `meteor npm install` while a dev server is up — it
invalidates the generated `_build/main-dev/*` entry shims and crashes the
running watcher with `Could not resolve meteor.mainModule`.

**Hygiene when switching builds:**

1. Stop the old server completely (Ctrl-C; confirm ports 3000 **and 8080**
   are free — see above).
2. Start the new build; wait for `[client-rspack] compiled`.
3. **Hard-refresh** the browser (Cmd+Shift+R) — or better, open a fresh
   incognito window. The old HMR session does not survive a
   package-selection change.
4. If phantom missing-module errors persist on a genuinely fresh page:
   `rm -rf .meteor/local/bundler-cache` and restart (keeps your data —
   `.meteor/local/db` is untouched).

**Recommended setup if you switch often:** give each build its own port so
sessions never cross — e.g. PACIO on `--port 3000`, Voyager on
`--port 3030`. Browser caches and HMR sockets are per-origin, which makes
the contamination structurally impossible.

## 11. Common pitfalls

| Symptom | Cause / fix |
|---|---|
| Measure calculates 0 / not in IP | Measurement period left at the 2024 default — set 2026 |
| Patient dropdown empty on /quality-measures | Minimongo has no patients yet — visit the dashboard first, run with `ENABLE_AUTOPUBLISH=true`, or use the console call |
| "not-computable" on CMS measures | Expected — import an ELM-bearing measure bundle first (`qualityMeasures.importMeasureBundle`); see `quality-measures/specs/cms1317/fhir/` |
| Directives list empty after load | You're not logged in (publication returns nothing), or data not loaded — rerun the footer button |
| QRDA export disabled | Intentional — not implemented; the track is FHIR-native |
