# Atmosphere Package Dissolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the last three Atmosphere packages (`clinical:fonts`, `clinical:extended-api`, `clinical:hl7-resource-datatypes`) by moving their still-used content into the app itself and removing them from `.meteor/packages` — completing the Atmosphere→npm exit.

**Architecture:** These are *dissolutions*, not package migrations — nothing stays a package. Fonts become app assets under `public/fonts/` + a plain CSS file. `extended-api`'s useful extension families — **`Session`, `String`, `Collection`, and `Random`** — become small clean core modules loaded at startup (bugs fixed, sync→async); the genuinely-dead pieces are dropped: the jQuery `Style.parse`, the build-time `Package.extensions` stub, and the unused `Meteor.isLandscape/isPortrait`. `hl7-resource-datatypes` is not ported at all — it dissolves as a byproduct of the separately-planned JSON Schema migration, leaving a 3-symbol residual to absorb.

**Tech Stack:** Meteor v3 (rspack/SWC), MongoDB, `moment` (already a dep, used by `Random.date`).

**Source of truth for the original files:** the Meteor package cache at
`~/.meteor/packages/clinical_fonts/1.2.0/`,
`~/.meteor/packages/clinical_extended-api/3.0.0/`,
`~/.meteor/packages/clinical_hl7-resource-datatypes/4.0.8/`. All exact
content needed is inlined below; the cache is the fallback if a binary must
be re-copied.

## Global Constraints

- Nothing remains an Atmosphere package; the end state removes all three lines from `.meteor/packages`.
- Do NOT remove a package line until its replacement is in place AND a build succeeds — removing first breaks the build.
- Port the `Session`, `String`, `Collection`, and `Random` extension families as clean core utilities (fix bugs, convert sync→async). Drop only `Style` (jQuery dep), `Package.extensions` (build-time stub), and `Meteor.isLandscape/isPortrait` (unused).
- Meteor v3 async on the server (`removeAsync`, not `.remove`); the original `extended-api` used sync v2 calls — port to async.
- Extensions load exactly once, at startup, on the correct locus (client vs server/both), before consumer code runs.
- File headers: path/name as the first commented line (repo convention).
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- `hl7-resource-datatypes` (Task 5) MUST run AFTER the JSON Schema migration (`docs/superpowers/plans/2026-07-01-simpleschema-to-jsonschema-migration.md`) is complete — it depends on the 83 SimpleSchema files being converted first.

## File map

| File | Responsibility |
|------|----------------|
| `public/fonts/*.ttf` (4 files) | Font binaries served statically |
| `client/fonts.css` | `@font-face` + font utility classes (URLs rewritten to `/fonts/`) |
| `client/main.css` | imports `fonts.css` |
| `imports/lib/extensions/SessionExtensions.js` | `Session.toggle/clear/remove/setAll` (client) |
| `imports/lib/extensions/StringExtensions.js` | `String.prototype.addUnderscores` (isomorphic, bug fixed) |
| `imports/lib/extensions/RandomExtensions.js` | `Random.date` (isomorphic) |
| `imports/lib/extensions/CollectionExtensions.js` | `Mongo.Collection.prototype.drop` (server, async) |
| startup entries | import the extension modules |
| `.meteor/packages` | remove the 3 package lines |

---

### Task 1: Move fonts to `public/fonts/` + app CSS

**Files:**
- Create: `public/fonts/3OF9_NEW.TTF`, `public/fonts/OpenSans-Light-webfont.ttf`, `public/fonts/OpenSans-Regular-webfont.ttf`, `public/fonts/echolot.regular.ttf`
- Create: `client/fonts.css`
- Modify: `client/main.css` (add one `@import`) — confirm this is the loaded global stylesheet (`grep -rn "main.css" client/`)

**Interfaces:**
- Produces: CSS classes `.Blockchain/.blockchain`, `.OpenSans/.opensans`, `.OpenSansLight/.opensans-light`, `.helveticas`, `.barcode` and the global `body` font — must render identically to today.

- [ ] **Step 1: Copy the 4 font binaries into `public/fonts/`**

```bash
mkdir -p public/fonts
SRC=$(find ~/.meteor/packages/clinical_fonts -path "*web.browser/*/fonts" -type d | head -1)
cp "$SRC/3OF9_NEW.TTF" "$SRC/OpenSans-Light-webfont.ttf" "$SRC/OpenSans-Regular-webfont.ttf" "$SRC/echolot.regular.ttf" public/fonts/
ls -1 public/fonts/
```
Expected: the four `.ttf`/`.TTF` files listed. (Meteor serves `public/fonts/x.ttf` at `/fonts/x.ttf`.)

- [ ] **Step 2: Create `client/fonts.css`** (original content; URLs rewritten `/packages/clinical_fonts/fonts/` → `/fonts/`)

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
.barcode{ font-family: Barcode; letter-spacing: 3px; }
@font-face{ font-family: Barcode;       src: url('/fonts/3OF9_NEW.TTF') format('truetype'); }
@font-face{ font-family: OpenSansLight; src: url('/fonts/OpenSans-Light-webfont.ttf') format('truetype'); }
@font-face{ font-family: OpenSans;      src: url('/fonts/OpenSans-Light-webfont.ttf') format('truetype'); }
@font-face{ font-family: Blockchain;    src: url('/fonts/echolot.regular.ttf') format('truetype'); }
.Blockchain, .blockchain{ font-family: "Blockchain"; }
.OpenSans, .opensans{ font-family: "OpenSans"; }
.OpenSansLight, .opensans-light{ font-family: "OpenSansLight"; }
```

- [ ] **Step 3: Import `fonts.css` from the global stylesheet**

At the TOP of `client/main.css`: `@import "./fonts.css";` (or the actual global CSS entry if `grep -rn "main.css" client/` shows a different one).

- [ ] **Step 4: Remove the package line and verify visually**

Delete `clinical:fonts` from `.meteor/packages`, then `meteor run --settings settings/settings.honeycomb.localhost.json`. Expected: app boots; body renders OpenSans; `/fonts/OpenSans-Light-webfont.ttf` loads 200 in devtools (not 404 at the old `/packages/clinical_fonts/...` path). Check consumers: `grep -rn "barcode\|blockchain\|opensans" imports/ --include="*.jsx" -il | head`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/ client/fonts.css client/main.css .meteor/packages
git commit -m "refactor: dissolve clinical:fonts into public/fonts + client/fonts.css"
```

---

### Task 2: Port the `Session` and `String` extensions into core

**Files:**
- Create: `imports/lib/extensions/SessionExtensions.js`, `imports/lib/extensions/StringExtensions.js`
- Test: `imports/lib/extensions/extensions.test.mjs`
- Modify: `package.json` (script `"test:extensions": "node --test imports/lib/extensions/*.test.mjs",`)

**Interfaces:**
- Produces `installSessionExtensions(Session)` — installs `toggle(key)` (flip bool), `clear(key)` (→ `null`), `remove(key)` (→ `undefined`), `setAll(obj)` (bulk set); all return `true`. Client-only side-effect install.
- Produces `installStringExtensions()` — installs `String.prototype.addUnderscores()` → `this` with spaces replaced by `_`. Isomorphic.
- **Scope:** `Session.toggle` (8 files) + `remove` (1 file) have live use; `clear`/`setAll` included for API completeness (original `console.log`s removed). `String.addUnderscores` currently 0 uses but ported as a fixed core utility (the original was **buggy** — it took an `input` arg and ignored `this`; fixed here to operate on `this`).

- [ ] **Step 1: Write the failing tests**

```js
// imports/lib/extensions/extensions.test.mjs — npm run test:extensions
import test from 'node:test';
import assert from 'node:assert/strict';
import { installSessionExtensions } from './SessionExtensions.js';
import { installStringExtensions } from './StringExtensions.js';

function fakeSession() {
  const store = {};
  return { get(k){ return store[k]; }, set(k,v){ store[k]=v; } };
}

test('Session.toggle flips true<->false, returns true', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('flag', true);
  assert.equal(S.toggle('flag'), true);
  assert.equal(S.get('flag'), false);
  S.toggle('flag');
  assert.equal(S.get('flag'), true);
});
test('Session.clear -> null, remove -> undefined, setAll bulk', function() {
  const S = fakeSession(); installSessionExtensions(S);
  S.set('x', 5); assert.equal(S.clear('x'), true); assert.equal(S.get('x'), null);
  S.set('y', 5); assert.equal(S.remove('y'), true); assert.equal(S.get('y'), undefined);
  assert.equal(S.setAll({ a: 1, b: 2 }), true);
  assert.equal(S.get('a'), 1); assert.equal(S.get('b'), 2);
});
test('String.addUnderscores operates on `this` (bug fixed)', function() {
  installStringExtensions();
  assert.equal('Quick brown fox'.addUnderscores(), 'Quick_brown_fox');
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test:extensions` → FAIL, modules missing.

- [ ] **Step 3: Implement**

```js
// imports/lib/extensions/SessionExtensions.js
// Core replacement for the Session.* helpers formerly in clinical:extended-api.
import { Meteor } from 'meteor/meteor';

export function installSessionExtensions(Session) {
  Session.toggle = function(key) {
    const current = Session.get(key);
    if (current === true) { Session.set(key, false); }
    else if (current === false) { Session.set(key, true); }
    return true;   // undefined/null: leave as-is (matches original)
  };
  Session.clear  = function(key) { Session.set(key, null);      return true; };
  Session.remove = function(key) { Session.set(key, undefined); return true; };
  Session.setAll = function(obj) {
    Object.keys(obj || {}).forEach(function(k) { Session.set(k, obj[k]); });
    return true;
  };
  return Session;
}

if (Meteor.isClient) {
  // eslint-disable-next-line import/no-unresolved
  const { Session } = require('meteor/session');
  installSessionExtensions(Session);
}
```

```js
// imports/lib/extensions/StringExtensions.js
// Core replacement for String.prototype.addUnderscores from clinical:extended-api.
// Bug fix: original took an `input` arg and ignored `this`; this operates on `this`.
export function installStringExtensions() {
  // eslint-disable-next-line no-extend-native
  String.prototype.addUnderscores = function() {
    return this.replace(/ /g, '_');
  };
}

installStringExtensions();
```

- [ ] **Step 4: Run to verify pass** — `npm run test:extensions` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add imports/lib/extensions/SessionExtensions.js imports/lib/extensions/StringExtensions.js imports/lib/extensions/extensions.test.mjs package.json
git commit -m "refactor: port Session + String extensions from clinical:extended-api into core"
```

---

### Task 3: Port the `Random` and `Collection` extensions into core

**Files:**
- Create: `imports/lib/extensions/RandomExtensions.js`, `imports/lib/extensions/CollectionExtensions.js`
- Test: append to `imports/lib/extensions/extensions.test.mjs`

**Interfaces:**
- Produces `makeRandomDate(fractionFn, maxDateAgo, dateFormat, momentLib)` (pure, testable) and `installRandomExtensions(Random)` installing `Random.date(maxDateAgo?, dateFormat?)` → moment-formatted random date (defaults `'1950-01-01'`, `'YYYY-MM-DD'`). Isomorphic. `Random.date` used in 1 file; `Random.integer/cardinal` dropped (0 uses).
- Produces `installCollectionExtensions(Mongo)` installing `Mongo.Collection.prototype.drop()` → `await this.removeAsync({})` (async — the original used sync v2 `_collection.remove({})`). Server-side.

- [ ] **Step 1: Write the failing tests** (append)

```js
import moment from 'moment';
import { makeRandomDate } from './RandomExtensions.js';

test('Random.date: fraction 0 -> today; honors format', function() {
  assert.equal(makeRandomDate(() => 0, '2000-01-01', 'YYYY-MM-DD', moment), moment().format('YYYY-MM-DD'));
  assert.match(makeRandomDate(() => 0, '2000-01-01', 'YYYY/MM/DD', moment), /^\d{4}\/\d{2}\/\d{2}$/);
});
```
(Collection.drop is exercised in Task 4's boot check — it needs a live Mongo, so no pure unit here.)

- [ ] **Step 2: Run to verify failure** — `npm run test:extensions` → FAIL, `RandomExtensions.js` missing.

- [ ] **Step 3: Implement**

```js
// imports/lib/extensions/RandomExtensions.js
// Core replacement for Random.date from clinical:extended-api.
import moment from 'moment';

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

{
  // eslint-disable-next-line import/no-unresolved
  const { Random } = require('meteor/random');
  installRandomExtensions(Random);
}
```

```js
// imports/lib/extensions/CollectionExtensions.js
// Core replacement for Mongo.Collection.prototype.drop from clinical:extended-api.
// Converted to Meteor v3 async (original used sync _collection.remove({})).
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export function installCollectionExtensions(MongoNs) {
  MongoNs.Collection.prototype.drop = async function() {
    return this.removeAsync({});
  };
  return MongoNs;
}

if (Meteor.isServer) {
  installCollectionExtensions(Mongo);
}
```
Note: the original also had an obscure `onInitialization`/`init`/`_initCommand` trio. Verify usage in Task 4 Step 2; do NOT port unless a real caller exists.

- [ ] **Step 4: Run to verify pass** — `npm run test:extensions` → PASS.

- [ ] **Step 5: Commit**

```bash
git add imports/lib/extensions/RandomExtensions.js imports/lib/extensions/CollectionExtensions.js imports/lib/extensions/extensions.test.mjs
git commit -m "refactor: port Random.date + Collection.drop(async) from clinical:extended-api into core"
```

---

### Task 4: Wire extensions at startup, confirm dropped code, remove the package

**Files:**
- Modify: client startup entry (`imports/startup/client/index.js` — confirm via `grep -rn "startup/client" client/main.js*`) and `server/main.js`
- Modify: `.meteor/packages` (remove `clinical:extended-api`)

**Interfaces:**
- Consumes the four extension modules (Tasks 2–3).
- Produces: `Session.*`, `String.prototype.addUnderscores`, `Random.date`, `Collection.prototype.drop` installed before any consumer runs.

- [ ] **Step 1: Import the extension modules at startup**

Client startup entry, near the top (before UI imports):
```js
import '/imports/lib/extensions/SessionExtensions.js';
import '/imports/lib/extensions/StringExtensions.js';
import '/imports/lib/extensions/RandomExtensions.js';
```
`server/main.js`, near the top:
```js
import '/imports/lib/extensions/StringExtensions.js';
import '/imports/lib/extensions/RandomExtensions.js';
import '/imports/lib/extensions/CollectionExtensions.js';
```
(`SessionExtensions` is `Meteor.isClient`-guarded — client only. `CollectionExtensions` is server only.)

- [ ] **Step 2: Verify the obscure Collection init trio is unused**

```bash
grep -rn "onInitialization\|\._initCommand\|Collection.*\.init(" imports/ server/ npmPackages/ --include="*.js"
```
Expected: no hits → do not port them. (If a hit exists, add the callback pattern to `CollectionExtensions.js` and note call sites.)

- [ ] **Step 3: Remove the package and boot**

Delete `clinical:extended-api` from `.meteor/packages`, then `meteor run --settings settings/settings.honeycomb.localhost.json`. Expected: boots clean; exercise a `Session.toggle` UI path (one of the 8 call sites) and confirm it flips.

- [ ] **Step 4: Confirm the intentionally-dropped code is gone**

```bash
grep -rn "clinical:extended-api" .meteor/ imports/ server/ | grep -v "\.git"
grep -rn "Style.parse\|Meteor.isLandscape\|Meteor.isPortrait" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx"
```
Expected: zero hits — the jQuery `Style.parse`, the build-time `Package.extensions` stub, and `Meteor.isLandscape/isPortrait` are intentionally NOT ported and are confirmed unreferenced.

- [ ] **Step 5: Commit**

```bash
git add .meteor/packages imports/startup/ server/main.js
git commit -m "refactor: wire core extensions at startup; drop clinical:extended-api"
```

---

### Task 5: Dissolve `clinical:hl7-resource-datatypes` (AFTER the JSON Schema migration)

> **Sequencing gate:** Do NOT start until
> `docs/superpowers/plans/2026-07-01-simpleschema-to-jsonschema-migration.md`
> is fully executed. That migration converts the 83 SimpleSchema files that
> account for the bulk of this package's 98 importers. Running Task 5 first
> means porting SimpleSchema datatype code that is about to be deleted.

**Files:**
- Modify: whatever files still import from `meteor/clinical:hl7-resource-datatypes` after the JSON Schema migration
- Create (only if needed): `imports/lib/fhirDatatypes/` for any genuinely-used residual helper
- Modify: `.meteor/packages` (remove `clinical:hl7-resource-datatypes`)

**Interfaces:**
- Context: `FhirUtilities` is ALREADY in core (`/imports/lib/FhirUtilities`) — NOT from this package; no action for it.
- Residual non-schema symbols imported across the repo (measured pre-migration): **`Annotation`, `Code`, `Period`** — three only. Everything else is `*Schema` definitions retired by the JSON Schema migration.

- [ ] **Step 1: Re-measure the residual after the JSON Schema migration**

```bash
grep -rl "meteor/clinical:hl7-resource-datatypes" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx"
grep -rhoE "import \{[^}]*\} from 'meteor/clinical:hl7-resource-datatypes'" imports/ server/ npmPackages/ --include="*.js" --include="*.jsx" | grep -oE "\{[^}]*\}" | tr ',' '\n' | tr -d '{} ' | sort -u | grep -v "^$"
```
Expected: a small set of files; symbols reduced to ~`Annotation`, `Code`, `Period`. If `*Schema` symbols remain, those files were not converted — finish them under the JSON Schema plan first, not here.

- [ ] **Step 2: Absorb the 3 residual symbols**

For each of `Annotation`, `Code`, `Period` still imported: read its definition in the cache
(`~/.meteor/packages/clinical_hl7-resource-datatypes/4.0.8/`), and either inline the small
value/type at the one or two call sites, or (if reused) add it to
`imports/lib/fhirDatatypes/index.js` and repoint imports there. These are FHIR datatype
primitives — natural companions to the `ui-fields` primitives library (see the DynamicFhir
enhancement plan) if display-oriented. Replace each
`from 'meteor/clinical:hl7-resource-datatypes'` import accordingly.

- [ ] **Step 3: Remove the package and build**

```bash
# delete clinical:hl7-resource-datatypes from .meteor/packages, then:
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

- **Scope coverage:** fonts (T1); `extended-api` — Session + String (T2), Random + Collection (T3), wiring + removal (T4); `hl7-resource-datatypes` gated behind the JSON Schema migration (T5). All three `.meteor/packages` lines removed by the end.
- **Ported the families the user requested** (`Session`, `String`, `Collection`, `Random`), fixing bugs (`String.addUnderscores` now uses `this`) and converting to async (`Collection.drop` → `removeAsync`).
- **Dropped, explicitly, not ported:** `Style.parse` (jQuery dep), `Package.extensions` (build-time stub), `Meteor.isLandscape/isPortrait` (0 uses) — named with justification in the architecture note + T4 Step 4.
- **Ordering hazard flagged:** T5's sequencing gate prevents porting soon-to-be-deleted SimpleSchema code.
- **No placeholder steps:** every code step contains actual content (font CSS, all four extension modules with tests, exact greps).
