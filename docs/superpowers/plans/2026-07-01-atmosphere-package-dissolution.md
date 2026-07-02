# Atmosphere Package Dissolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the last three Atmosphere packages (`clinical:fonts`, `clinical:extended-api`, `clinical:hl7-resource-datatypes`) by moving their still-used content into the app itself and removing them from `.meteor/packages` — completing the Atmosphere→npm exit.

**Architecture:** These are *dissolutions*, not package migrations — nothing stays a package. Fonts become app assets under `public/fonts/` + a plain CSS file. `extended-api` collapses to two tiny prototype-extension modules loaded at startup (only `Session.toggle`, `Session.remove`, `Random.date` are actually used; the rest is dead — a jQuery `Style.parse`, a buggy `String.prototype.addUnderscores`, a build-time `Package.extensions` stub). `hl7-resource-datatypes` is not ported at all — it dissolves as a byproduct of the separately-planned JSON Schema migration, leaving a 3-symbol residual to absorb.

**Tech Stack:** Meteor v3 (rspack/SWC), MongoDB, `moment` (already a dep, used by `Random.date`).

**Source of truth for the original files:** the Meteor package cache at
`~/.meteor/packages/clinical_fonts/1.2.0/`,
`~/.meteor/packages/clinical_extended-api/3.0.0/`,
`~/.meteor/packages/clinical_hl7-resource-datatypes/4.0.8/`. All exact
content needed is inlined in this plan; the cache is the fallback if a binary
must be re-copied.

## Global Constraints

- Nothing remains an Atmosphere package; the end state removes all three lines from `.meteor/packages`.
- Do NOT remove a package line until its replacement is in place AND a build succeeds — removing first breaks the build.
- Meteor v3 async on the server (`removeAsync`, not `.remove`); the original `extended-api` used sync v2 calls — port to async.
- Prototype extensions load exactly once, at startup, on the correct locus (client vs server), before consumer code runs.
- File headers: path/name as the first commented line (repo convention).
- Port ONLY symbols with real usage; drop dead code (do not port for completeness).
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- `hl7-resource-datatypes` (Task 5) MUST run AFTER the JSON Schema migration (`docs/superpowers/plans/2026-07-01-simpleschema-to-jsonschema-migration.md`) is complete — it depends on the 83 SimpleSchema files being converted first.

## File map

| File | Responsibility |
|------|----------------|
| `public/fonts/*.ttf` (4 files) | Font binaries served statically |
| `client/fonts.css` | `@font-face` + font utility classes (URLs rewritten to `/fonts/`) |
| `client/main.css` or client entry | imports `fonts.css` |
| `imports/lib/extensions/SessionExtensions.js` | `Session.toggle` / `Session.remove` (client) |
| `imports/lib/extensions/RandomExtensions.js` | `Random.date` (isomorphic) |
| `imports/startup/client/index.js` + server entry | import the extension modules at startup |
| `.meteor/packages` | remove the 3 package lines |

---

### Task 1: Move fonts to `public/fonts/` + app CSS

**Files:**
- Create: `public/fonts/3OF9_NEW.TTF`, `public/fonts/OpenSans-Light-webfont.ttf`, `public/fonts/OpenSans-Regular-webfont.ttf`, `public/fonts/echolot.regular.ttf`
- Create: `client/fonts.css`
- Modify: `client/main.css` (add one `@import`) — confirm this is the loaded global stylesheet first (`grep -rn "main.css" client/`)

**Interfaces:**
- Produces: CSS classes `.Blockchain/.blockchain`, `.OpenSans/.opensans`, `.OpenSansLight/.opensans-light`, `.helveticas`, `.barcode` and the global `body` font — these must render identically to today (no visual regression).

- [ ] **Step 1: Copy the 4 font binaries into `public/fonts/`**

Run:
```bash
mkdir -p public/fonts
SRC=$(find ~/.meteor/packages/clinical_fonts -path "*web.browser/*/fonts" -type d | head -1)
cp "$SRC/3OF9_NEW.TTF" "$SRC/OpenSans-Light-webfont.ttf" "$SRC/OpenSans-Regular-webfont.ttf" "$SRC/echolot.regular.ttf" public/fonts/
ls -1 public/fonts/
```
Expected: the four `.ttf`/`.TTF` files listed. (Meteor serves `public/fonts/x.ttf` at `/fonts/x.ttf`.)

- [ ] **Step 2: Create `client/fonts.css`** (original content, URLs rewritten `/packages/clinical_fonts/fonts/` → `/fonts/`)

```css
/* client/fonts.css — migrated from clinical:fonts@1.2.0 (2026-07). */
body{
  font-family: "OpenSans", "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  font-weight: 300;
}
.helveticas{
  font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, "OpenSans", Arial, "Lucida Grande", sans-serif;
  font-weight: 300;
}
.barcode{
  font-family: Barcode;
  letter-spacing: 3px;
}
@font-face{ font-family: Barcode;       src: url('/fonts/3OF9_NEW.TTF') format('truetype'); }
@font-face{ font-family: OpenSansLight; src: url('/fonts/OpenSans-Light-webfont.ttf') format('truetype'); }
@font-face{ font-family: OpenSans;      src: url('/fonts/OpenSans-Light-webfont.ttf') format('truetype'); }
@font-face{ font-family: Blockchain;    src: url('/fonts/echolot.regular.ttf') format('truetype'); }
.Blockchain, .blockchain{ font-family: "Blockchain"; }
.OpenSans, .opensans{ font-family: "OpenSans"; }
.OpenSansLight, .opensans-light{ font-family: "OpenSansLight"; }
```

- [ ] **Step 3: Import `fonts.css` from the global stylesheet**

At the TOP of `client/main.css` add:
```css
@import "./fonts.css";
```
(If `grep -rn "main.css" client/` shows a different global CSS entry, import it there instead.)

- [ ] **Step 4: Remove the package line and verify visually**

In `.meteor/packages`, delete the line `clinical:fonts`. Then:
```bash
meteor run --settings settings/settings.honeycomb.localhost.json
```
Expected: app boots; the body renders in OpenSans and the barcode/blockchain classes still resolve. In devtools Network, confirm `/fonts/OpenSans-Light-webfont.ttf` loads 200 (not 404 at the old `/packages/clinical_fonts/...` path). Grep first to see who relies on the classes: `grep -rn "barcode\|blockchain\|opensans" imports/ --include="*.jsx" -il | head`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/ client/fonts.css client/main.css .meteor/packages
git commit -m "refactor: dissolve clinical:fonts into public/fonts + client/fonts.css"
```

---

### Task 2: Port the live `Session` extensions into core

**Files:**
- Create: `imports/lib/extensions/SessionExtensions.js`
- Test: `imports/lib/extensions/SessionExtensions.test.mjs`
- Modify: `package.json` (script `"test:extensions": "node --test imports/lib/extensions/*.test.mjs",`)

**Interfaces:**
- Produces (client-side, on the Meteor `Session` object): `Session.toggle(key)` — flips a boolean session var (used in 8 files); `Session.remove(key)` — sets it to `undefined` (1 file). Both return `true`.
- The module is import-for-side-effect: `import '/imports/lib/extensions/SessionExtensions.js'` installs the methods. `Session` is provided by `meteor/session`.

**Why only these two:** usage grep across `imports/ server/ client/ npmPackages/` — `Session.toggle` 8 files, `Session.remove` 1 file; `Session.clear` 0, `Session.setAll` 0. Drop `clear`/`setAll`.

- [ ] **Step 1: Write the failing test** (pure logic, no Meteor — test the toggle/remove behavior against a fake Session)

```js
// imports/lib/extensions/SessionExtensions.test.mjs — npm run test:extensions
import test from 'node:test';
import assert from 'node:assert/strict';
import { installSessionExtensions } from './SessionExtensions.js';

function fakeSession() {
  const store = {};
  return {
    _store: store,
    get(k) { return store[k]; },
    set(k, v) { store[k] = v; }
  };
}

test('toggle flips true<->false and returns true', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('flag', true);
  assert.equal(S.toggle('flag'), true);
  assert.equal(S.get('flag'), false);
  S.toggle('flag');
  assert.equal(S.get('flag'), true);
});

test('remove sets the key to undefined and returns true', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('x', 5);
  assert.equal(S.remove('x'), true);
  assert.equal(S.get('x'), undefined);
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test:extensions` → FAIL, `Cannot find module './SessionExtensions.js'`.

- [ ] **Step 3: Implement** (a pure `installSessionExtensions(Session)` for testability + a Meteor side-effect install)

```js
// imports/lib/extensions/SessionExtensions.js
// Core replacement for the Session.* helpers formerly in clinical:extended-api.
// Only the methods with real usage are kept (toggle, remove).
import { Meteor } from 'meteor/meteor';

export function installSessionExtensions(Session) {
  Session.toggle = function(key) {
    const current = Session.get(key);
    if (current === true) { Session.set(key, false); }
    else if (current === false) { Session.set(key, true); }
    // undefined/null: leave as-is (matches original behavior)
    return true;
  };
  Session.remove = function(key) {
    Session.set(key, undefined);
    return true;
  };
  return Session;
}

// Side-effect install on the real Meteor Session (client only — Session is a client construct).
if (Meteor.isClient) {
  // eslint-disable-next-line import/no-unresolved
  const { Session } = require('meteor/session');
  installSessionExtensions(Session);
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test:extensions` → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add imports/lib/extensions/SessionExtensions.js imports/lib/extensions/SessionExtensions.test.mjs package.json
git commit -m "refactor: port Session.toggle/remove from clinical:extended-api into core"
```

---

### Task 3: Port `Random.date` into core

**Files:**
- Create: `imports/lib/extensions/RandomExtensions.js`
- Test: `imports/lib/extensions/RandomExtensions.test.mjs`

**Interfaces:**
- Produces (on the Meteor `Random` object, isomorphic): `Random.date(maxDateAgo?, dateFormat?)` → a `moment`-formatted random date string between `maxDateAgo` (default `'1950-01-01'`) and now, format default `'YYYY-MM-DD'`. Used in 1 file.
- Import-for-side-effect installs it; `Random` from `meteor/random`, `moment` from npm.

**Why only `date`:** `Random.integer` 0 uses, `Random.cardinal` 0 uses — drop them.

- [ ] **Step 1: Write the failing test** (inject fake `Random`/`moment`-free by testing the pure generator)

```js
// imports/lib/extensions/RandomExtensions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import moment from 'moment';
import { makeRandomDate } from './RandomExtensions.js';

test('returns a formatted date between maxDateAgo and now', function() {
  // deterministic fraction = 0 -> today; = ~1 -> near maxDateAgo
  const today = makeRandomDate(() => 0, '2000-01-01', 'YYYY-MM-DD', moment);
  assert.equal(today, moment().format('YYYY-MM-DD'));
  const far = makeRandomDate(() => 0.999999, '2000-01-01', 'YYYY-MM-DD', moment);
  assert.ok(far >= '2000-01-01' && far <= moment().format('YYYY-MM-DD'));
});

test('honors a custom format', function() {
  const d = makeRandomDate(() => 0, '2000-01-01', 'YYYY/MM/DD', moment);
  assert.match(d, /^\d{4}\/\d{2}\/\d{2}$/);
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test:extensions` → FAIL, module missing.

- [ ] **Step 3: Implement**

```js
// imports/lib/extensions/RandomExtensions.js
// Core replacement for Random.date from clinical:extended-api (only used helper).
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

// Pure, injectable core (fractionFn returns [0,1); moment injected for testability).
export function makeRandomDate(fractionFn, maxDateAgo, dateFormat, momentLib) {
  const start = momentLib(maxDateAgo || '1950-01-01');
  const now = momentLib();
  const totalDays = momentLib.duration(now.diff(start)).as('days');
  const randomDays = parseInt(fractionFn() * totalDays, 10);
  return now.subtract(randomDays, 'days').format(dateFormat || 'YYYY-MM-DD');
}

export function installRandomExtensions(Random) {
  Random.date = function(maxDateAgo, dateFormat) {
    return makeRandomDate(function() { return Random.fraction(); }, maxDateAgo, dateFormat, moment);
  };
  return Random;
}

// Side-effect install (isomorphic — Random exists on client and server).
{
  // eslint-disable-next-line import/no-unresolved
  const { Random } = require('meteor/random');
  installRandomExtensions(Random);
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test:extensions` → PASS (4 tests total across both extension files).

- [ ] **Step 5: Commit**

```bash
git add imports/lib/extensions/RandomExtensions.js imports/lib/extensions/RandomExtensions.test.mjs
git commit -m "refactor: port Random.date from clinical:extended-api into core"
```

---

### Task 4: Wire extensions at startup, verify `.drop()`, remove the package

**Files:**
- Modify: client startup entry (`imports/startup/client/index.js` — confirm with `grep -rn "startup/client" client/main.js*`) and server startup entry (`server/main.js`)
- Modify: `.meteor/packages` (remove `clinical:extended-api`)

**Interfaces:**
- Consumes: the two extension modules from Tasks 2–3.
- Produces: `Session.toggle/remove` and `Random.date` installed globally before any consumer runs.

- [ ] **Step 1: Import the extension modules at startup**

In the client startup entry, near the top (before UI imports):
```js
import '/imports/lib/extensions/SessionExtensions.js';
import '/imports/lib/extensions/RandomExtensions.js';
```
In `server/main.js`, near the top:
```js
import '/imports/lib/extensions/RandomExtensions.js';   // Random.date used server-side too
```
(SessionExtensions is client-only by construction — its side-effect block is `Meteor.isClient`-guarded, so importing it on the server is harmless but unnecessary; import it only on the client.)

- [ ] **Step 2: Verify `Mongo.Collection.prototype.drop()` is unused before dropping it**

The original package also monkeypatched `Collection.drop()`/`onInitialization()`/`init()`. Confirm nothing depends on them (the `.drop(` grep is ambiguous, so verify precisely):
```bash
grep -rnE "\.drop\(\s*\)" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx"
grep -rn "onInitialization\|\._initCommand\|Collection.*\.init(" imports/ server/ npmPackages/ --include="*.js"
```
Expected: no hits on Mongo collections. **If a real `collection.drop()` call exists**, add a `CollectionExtensions.js` module (same pattern) implementing `Mongo.Collection.prototype.drop = async function(){ return this.removeAsync({}); }` (async — the original's sync `_collection.remove({})` is Meteor v2), import it at startup, and note the call sites must `await`. Otherwise skip — do not port dead code.

- [ ] **Step 3: Remove the package and boot**

Delete `clinical:extended-api` from `.meteor/packages`, then:
```bash
meteor run --settings settings/settings.honeycomb.localhost.json
```
Expected: boots clean. Exercise a `Session.toggle` path in the UI (e.g. a sidebar/checkbox toggle among the 8 call sites) and confirm it still flips.

- [ ] **Step 4: Confirm the dead code is truly gone**

```bash
grep -rn "clinical:extended-api" .meteor/ imports/ server/ | grep -v "\.git"
grep -rn "Style.parse\|addUnderscores\|Meteor.isLandscape\|Meteor.isPortrait\|Session.setAll\|Session.clear\b\|Random.integer\|Random.cardinal" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx"
```
Expected: zero hits (dead symbols confirmed unused and unreferenced; the jQuery `Style.parse` and buggy `String.prototype.addUnderscores` are intentionally NOT ported).

- [ ] **Step 5: Commit**

```bash
git add .meteor/packages imports/startup/ server/main.js
git commit -m "refactor: wire core extensions at startup; drop clinical:extended-api"
```

---

### Task 5: Dissolve `clinical:hl7-resource-datatypes` (AFTER the JSON Schema migration)

> **Sequencing gate:** Do NOT start this task until
> `docs/superpowers/plans/2026-07-01-simpleschema-to-jsonschema-migration.md`
> is fully executed. That migration converts the 83 SimpleSchema files that
> account for the bulk of this package's 98 importers. Running Task 5 first
> means porting SimpleSchema datatype code that is about to be deleted.

**Files:**
- Modify: whatever files still import from `meteor/clinical:hl7-resource-datatypes` after the JSON Schema migration
- Create (only if needed): `imports/lib/fhirDatatypes/` for any genuinely-used residual datatype helper
- Modify: `.meteor/packages` (remove `clinical:hl7-resource-datatypes`)

**Interfaces:**
- Context: `FhirUtilities` is ALREADY in core (`/imports/lib/FhirUtilities`) — it does NOT come from this package; no action needed for it.
- Residual non-schema symbols imported from the package across the whole repo (measured pre-migration): **`Annotation`, `Code`, `Period`** — three only. Everything else is `*Schema` datatype definitions retired by the JSON Schema migration.

- [ ] **Step 1: Re-measure the residual after the JSON Schema migration**

```bash
grep -rl "meteor/clinical:hl7-resource-datatypes" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx"
grep -rhoE "import \{[^}]*\} from 'meteor/clinical:hl7-resource-datatypes'" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx" | grep -oE "\{[^}]*\}" | tr ',' '\n' | tr -d '{} ' | sort -u | grep -v "^$"
```
Expected: a small set of files, symbols reduced to roughly `Annotation`, `Code`, `Period` (plus any `*Schema` stragglers the migration missed — if `*Schema` symbols remain, those files were not converted; finish them under the JSON Schema plan first, not here).

- [ ] **Step 2: Absorb the 3 residual symbols**

For each of `Annotation`, `Code`, `Period` still imported: read its definition in the cache
(`~/.meteor/packages/clinical_hl7-resource-datatypes/4.0.8/`), and either (a) inline the tiny
value/type at the one or two call sites, or (b) if reused, add it to
`imports/lib/fhirDatatypes/index.js` and repoint imports there. These are FHIR datatype
primitives — natural companions to the `ui-fields` primitives library if display-oriented.
Replace each `from 'meteor/clinical:hl7-resource-datatypes'` import accordingly.

- [ ] **Step 3: Remove the package and build**

Delete `clinical:hl7-resource-datatypes` from `.meteor/packages`, then:
```bash
grep -rn "clinical:hl7-resource-datatypes" imports/ server/ npmPackages/ .meteor/packages   # → zero
meteor run --settings settings/settings.honeycomb.localhost.json                             # boots clean
npm test                                                                                      # green
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: dissolve clinical:hl7-resource-datatypes; Atmosphere exit complete"
```

---

## Self-review notes (applied)

- **Scope coverage:** fonts (T1), extended-api Session (T2) + Random (T3) + wiring/removal/`.drop` verification (T4), hl7-resource-datatypes dissolution gated behind the JSON Schema migration (T5). All three `.meteor/packages` lines removed by the end.
- **Dead code explicitly dropped, not ported:** `Session.clear/setAll`, `Random.integer/cardinal`, `Meteor.isLandscape/isPortrait`, `String.prototype.addUnderscores` (buggy), `Style.parse` (jQuery dep), `Package.extensions` (build-time stub) — each named with its zero-usage justification in T2/T3/T4.
- **Async correctness:** the ported `Collection.drop` (only if T4 Step 2 finds a real use) is `removeAsync`-based, not the original sync v2 call.
- **Ordering hazard flagged:** T5's sequencing gate prevents porting soon-to-be-deleted SimpleSchema code.
- **No placeholder steps:** every code step contains the actual content (font CSS, both extension modules with tests, exact greps).
