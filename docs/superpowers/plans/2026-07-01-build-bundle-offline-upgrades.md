# Build / Bundle / Offline Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the initial download and harden the build spine — WITHOUT re-litigating the Atmosphere→npm-workspace migration (which is done well). Six targeted changes derived from `fable/OPUS_NOF_ARCHITECTURE_BUILD_BUNDLE_OFFLINE.md` B-1..B-6: (B-1) route-level code-splitting of `App.jsx`'s 190 eager imports + the 45 eager workflow `client.js` trees, following the `pacio-core` `React.lazy` pattern; (B-2) fail-loud codegen (error, not warn, on a missing enabled package) + watched barrels so `EXTRA_WORKFLOWS` changes don't need a full restart; (B-3 native) a CI verify of the native-dep externalization across platforms; (B-4/B-5) an explicit decide-and-commit on mobile/offline; (B-5 cleanup) the `lodash: 4.18.1` version-pin typo.

**Architecture:** The build is Meteor v3 with `@meteorjs/rspack` (rspack + SWC). Workflow packages are bundled via a **build-time codegen barrel** (`workflows/rspack.workflowParser.js`) whose `generate()` runs once at config-eval (`rspack.config.js:14`) and emits static `import * as _workflow${index} from '<pkg>'` (`generateBarrel()`, `:269-275`). `App.jsx` builds a static `dynamicRoutes` array (`:594`) of `{ path, element: <EagerlyImportedPage /> }` — 190 top-level imports (`:1`), **zero** `React.lazy`. Only `pacio-core` among 46 `npmPackages/*/client.js` uses `React.lazy` (its `withSuspense()` helper, `client.js:41-53`). This plan copies that pattern into `App.jsx` and the eager workflow trees, then tightens the codegen and settles mobile/offline.

**Tech Stack:** React 18 (`React.lazy` + `Suspense`), Material-UI v5 (`CircularProgress` fallbacks), Meteor v3, rspack/SWC codegen, `bundle-visualizer` (already wired: `package.json:28` `"visualize"`).

## Global Constraints

- **Do not re-plan the migration.** The npm-workspace estate, `validateWorkflows()` throwing on malformed `workflow.json`, the `Package`-registry symmetry, and the desktop packaging are all sound — leave them. This plan only touches bundling, codegen fail-loudness, and mobile/offline posture.
- **Preserve the route contract.** `App.jsx` renders `route.element` (`:686`, `:2098`); the `component:` fallback is dead/commented (`:1181-1182`). Lazy routes must still produce a valid `element` (a `<Suspense>`-wrapped lazy component), never a `component:` reference.
- **Every lazy boundary needs a `Suspense` fallback** — `<CircularProgress />` in a centered `<Box>`, mirroring `pacio-core`'s `Loading` (`client.js:24-38`) and the theming rules (`.claude/rules/ui/theming.md` — tokens, not hardcoded surface colors).
- **Measure before/after with `bundle-visualizer`.** The B-1 win is quantitative; capture initial-chunk size both ways.
- **Boot-verify after every task** on a real `App running at` line, exercising at least one lazy route and one workflow route.
- Commit after every task; end commit messages with the Claude Code co-author trailer.
- `EXTRA_WORKFLOWS` gotcha (memory: *EXTRA_WORKFLOWS Restart Gotcha*): the parser runs once at rspack boot, so route changes need a full restart today — Task 2 addresses exactly this.

## File map

| File | Responsibility |
|------|----------------|
| `imports/ui/lazyRoute.jsx` | shared `lazyRoute(importFn)` → `Suspense`-wrapped lazy element (the `App.jsx` counterpart of pacio-core's `withSuspense`) |
| `imports/ui/App.jsx` | convert the `dynamicRoutes` eager imports (`:594+`, top imports `:82-560`) to `lazyRoute(...)` |
| `npmPackages/*/client.js` | convert eager page imports to `React.lazy` per the pacio-core exemplar (one exemplar package here; bulk is a follow-up loop) |
| `workflows/rspack.workflowParser.js` | fail-loud `require.resolve()` gate (`:42`, `:58`) + watch generated barrels (`apply()`, `:106`) |
| `package.json` | fix `"lodash": "4.18.1"` → `"^4.17.21"` (`:111`); add `"analyze:bundle"` convenience script |
| `docs/mobile-offline-decision.md` | the B-4/B-5 decide-and-commit record (created by Task 4) |
| `.github/`/CI config or `scripts/verify-native-externals.js` | B-3 native-externalization cross-platform smoke |

---

### Task 1: Route-level code-splitting of `App.jsx` (the headline bundle win)

**Problem:** `App.jsx` has 190 static imports (`:1`, verified `grep -c "^import"` → 190) and **zero** `React.lazy` (verified → 0). `dynamicRoutes` (`:594`) is a static array of `{ path, element: <Page /> }` where every `<Page />` was imported eagerly at module top (49 of them from `../ui-fhir/*`, verified). Result: **all 90+ FHIR resource UIs ship in the initial download.** `pacio-core` already proves the fix (`React.lazy` + a `withSuspense` HOC, `client.js:41-53`) — copy it.

**Files:**
- Create: `imports/ui/lazyRoute.jsx`
- Modify: `imports/ui/App.jsx` (top imports `:82-560`, `dynamicRoutes` `:594+`)
- Modify: `package.json` (add `"analyze:bundle"`)

**Interfaces:**
- `lazyRoute(importFn)` → a React element: `<Suspense fallback={<RouteLoading/>}><Lazy/></Suspense>`, where `Lazy = React.lazy(importFn)`. Callers write `element: lazyRoute(() => import('../ui-fhir/observations/ObservationsPage'))` instead of `element: <ObservationsPage />`. This keeps the `route.element` contract (`App.jsx:686`) intact — the element is still a valid React element, just Suspense-wrapped around a lazy chunk.

- [ ] **Step 1: Baseline the bundle.** Run `meteor --production --extra-packages bundle-visualizer` (the existing `npm run visualize`, `package.json:28`), open the visualizer, and **record** the initial/entry-chunk size and the largest `ui-fhir` contributors. Save the number in the commit message and in a scratch note; this is the before-measurement. If `bundle-visualizer` needs the Atmosphere package, it is added by the `--extra-packages` flag already in the script — no manifest edit.
- [ ] **Step 2: Write `imports/ui/lazyRoute.jsx`.** Mirror `pacio-core`'s `Loading` + `withSuspense` (`npmPackages/pacio-core/client.js:24-47`) but as a route-element factory and theme-token-compliant (no hardcoded grey; use `theme.palette.background.default`). Real code:

  ```jsx
  // imports/ui/lazyRoute.jsx
  import React, { Suspense } from 'react';
  import { Box, CircularProgress } from '@mui/material';

  // Centered spinner shown while a lazy route chunk downloads. Theme-token
  // driven (background.default) so it obeys the CustomThemeProvider palette in
  // both light and dark — see .claude/rules/ui/theming.md.
  function RouteLoading() {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // lazyRoute(() => import('../ui-fhir/observations/ObservationsPage'))
  //   -> a Suspense-wrapped element usable directly as a route `element`.
  // Handles both default and named exports: if the module has no default,
  // fall back to the first PascalCase export (mirrors pacio-core's
  // `.then(m => ({ default: m.Foo }))` idiom but generically).
  export function lazyRoute(importFn, exportName) {
    const Lazy = React.lazy(function() {
      return importFn().then(function(mod) {
        if (mod && mod.default) return mod;
        const key = exportName || Object.keys(mod).find(function(k) {
          return typeof mod[k] === 'function' && /^[A-Z]/.test(k);
        });
        return { default: mod[key] };
      });
    });
    return (
      <Suspense fallback={<RouteLoading />}>
        <Lazy />
      </Suspense>
    );
  }
  ```

- [ ] **Step 3: Convert the `ui-fhir` route surface.** In `App.jsx`, for every `../ui-fhir/*` page/detail component used only inside `dynamicRoutes`, delete the top-level `import X from '../ui-fhir/.../X'` and replace its `element: <X />` with `element: lazyRoute(() => import('../ui-fhir/.../X'))`. Add `import { lazyRoute } from './lazyRoute.jsx';` near the top. Work in batches (e.g. 10 imports at a time) and re-grep after each batch: `grep -c "^import" imports/ui/App.jsx` should fall from 190, and `grep -c "React.lazy\|lazyRoute" imports/ui/App.jsx` should rise. **Leave chrome eager** (`Header`, `Footer`, `SideDrawer`, `AuthenticatedRoute`, `NotFoundPage`, `HomePage`/`WelcomePage`/`GettingStartedPage`) — these are on the first paint and lazying them only adds spinner churn.
- [ ] **Step 4: Verify — boot + navigate + network.** `meteor run --settings settings/settings.honeycomb.localhost.json`; confirm `App running at`. Open the app, watch the Network tab, and navigate to 3–4 converted routes (e.g. `/observations`, `/conditions`, an ImagingStudy route) — confirm a **new JS chunk loads per route** (proving the split) and the page renders identically, spinner-then-content. Confirm a non-converted chrome route (`/home`) still renders with no regressions. Check the console for `Suspense`/lazy warnings.
- [ ] **Step 5: Re-measure + commit.** Re-run `npm run visualize`; record the new entry-chunk size and the delta vs Step 1 in the commit message (this is the headline number). Add a `"analyze:bundle": "meteor --production --extra-packages bundle-visualizer"` alias to `package.json` scripts (it duplicates `visualize` under a discoverable name; keep both). `git add imports/ui/lazyRoute.jsx imports/ui/App.jsx package.json && git commit -m "perf(bundle): route-level code-splitting of App.jsx via React.lazy (initial chunk N MB -> M MB)"`

---

### Task 2: Lazy the eager workflow `client.js` trees (exemplar) + document the pattern

**Problem:** Only **1 of 46** `npmPackages/*/client.js` uses `React.lazy` (`pacio-core`, verified via `grep -rl "React.lazy" npmPackages/*/client.js`). The other 45 statically import their page trees at `client.js` top, and the codegen barrel pulls each `client.js` into the **main bundle** (`generateBarrel()` emits `import * as _workflow${index}`, `:269-275`) — so every enabled workflow's whole page tree is eager. `pacio-core` is the copy-paste exemplar (`withSuspense` + `React.lazy(() => import(...).then(m => ({ default: m.Foo })))`, `client.js:41-137`).

**Files:**
- Modify (exemplar): one representative multi-page workflow's `client.js` — pick the largest eager one, e.g. `npmPackages/radiology-workflow/client.js` (fall back to `fhir-graph` or `structured-data-capture` if radiology is already light)
- Reference: `npmPackages/pacio-core/client.js:41-53` (the `withSuspense` HOC to copy)

**Interfaces:**
- Per-package `withSuspense(Component)` HOC + `React.lazy(() => import('./client/pages/Foo'))` for each routed page, exactly as `pacio-core`. The package's `DynamicRoutes` still export `element: <FooSuspended />` — the barrel contract is unchanged; only the imports become lazy chunks.

- [ ] **Step 1: Pick the exemplar + baseline.** `for d in npmPackages/*/; do echo "$(grep -c "^import" "$d/client.js" 2>/dev/null) $d"; done | sort -rn | head` to find the heaviest eager `client.js` (most top-level imports). Enable it via `EXTRA_WORKFLOWS=<pkg> npm run visualize` and record its contribution to the main chunk.
- [ ] **Step 2: Copy the `withSuspense` pattern.** Add the `Loading` + `withSuspense` block from `pacio-core/client.js:24-47` to the exemplar's `client.js` (or import a shared copy). Convert each **routed page** import from `import Foo from './client/pages/Foo'` to:

  ```jsx
  const FooLazy = React.lazy(() => import('./client/pages/Foo'));
  const Foo = withSuspense(FooLazy);
  ```

  Preserve named-export pages with the `.then(m => ({ default: m.Foo }))` form (as pacio-core does at `:50-51`). **Keep inline widgets eager** — anything rendered as a table row / footer button / config tab (pacio-core keeps `AdmitDischargeButton`/`InpatientModeConfig` direct, `client.js:20-21`), because those render inside already-loaded surfaces and lazying them adds spinner flicker.
- [ ] **Step 3: Verify.** `EXTRA_WORKFLOWS=<pkg> meteor run --settings settings/settings.honeycomb.localhost.json`; boot to `App running at`; navigate the workflow's routes and confirm per-route chunk loads (Network tab) and identical rendering. Re-run the visualizer with the same `EXTRA_WORKFLOWS` and record the main-chunk reduction.
- [ ] **Step 4: Document the follow-up.** Add a short "Lazy your routed pages" note to `npmPackages/CLAUDE.md` (near the `client.js` Pattern section) pointing at `pacio-core` as the reference and noting the remaining ~44 packages are a per-package follow-up loop (one package per iteration — convert its routed-page imports, boot-verify). Do **not** convert all 44 here.
- [ ] **Step 5: Commit.** `git add npmPackages/<pkg>/client.js npmPackages/CLAUDE.md && git commit -m "perf(bundle): lazy-load routed pages in <pkg> workflow (pacio-core pattern) + document follow-up"`

---

### Task 3: Fail-loud codegen + watched barrels (B-2)

**Problem:** The workflow parser gates enablement with `require.resolve()` and only `console.warn`s on failure (`:42-47` for manifest workflows, `:57-62` for `EXTRA_WORKFLOWS`). A partial `npm install` (atomic abort → no symlink) therefore silently drops an **enabled** package and its routes 404 with **no build error** (memory: *Workflow Route 404 = resolve gate*). And `generate()` runs once at config-eval (`rspack.config.js:14`); the generated barrels under `imports/workflows/` aren't watched, so adding a workflow or changing `EXTRA_WORKFLOWS` needs a **full restart** (memory: *EXTRA_WORKFLOWS Restart Gotcha*).

**Files:**
- Modify: `workflows/rspack.workflowParser.js` — the enablement filter (`:39-48`), the `EXTRA_WORKFLOWS` loop (`:53-76`), and `apply()` (`:106-111`)

**Interfaces:**
- The `require.resolve()` skip becomes a **hard error** for a package that is *declared enabled* (manifest `enabled !== false`, or named in `EXTRA_WORKFLOWS`): a missing symlink now **throws** and fails the build, instead of warning and 404-ing at runtime. Preserve the existing skip-silently behavior only for `enabled: false` manifest entries (those are intentionally off). Matches the "fail-loud dependency resolution" anchor.
- `apply()` additionally registers `compiler.hooks` file dependencies on `workflows.json` and the generated barrels so rspack re-runs codegen when they change (watch integration), reducing the full-restart requirement for barrel changes.

- [ ] **Step 1: Fail-loud the manifest gate.** In the enablement filter (`:39-48`), split "intentionally disabled" from "enabled but unresolvable". Real change:

  ```js
  const enabledWorkflows = [];
  (manifest.workflows || []).forEach(function(w) {
    if (w.enabled === false) return; // intentionally off — skip silently
    try {
      require.resolve(w.package);
      enabledWorkflows.push(w);
    } catch (e) {
      // Enabled in the manifest but not installed: a partial/aborted npm install
      // left no symlink. Do NOT silently drop it (routes would 404 with no build
      // error). Fail the build loudly — see fable B-2 / memory "Workflow Route 404".
      throw new Error(
        '[WorkflowParser] Enabled workflow "' + w.package + '" is not installed ' +
        '(require.resolve failed). Run `npm install` to symlink it, or set ' +
        '"enabled": false in workflows/workflows.json. Original: ' + e.message
      );
    }
  });
  ```

- [ ] **Step 2: Fail-loud the `EXTRA_WORKFLOWS` gate.** In the `EXTRA_WORKFLOWS` loop (`:57-62`), a package the operator *explicitly asked for* that isn't installed should also throw (not warn-and-skip), with the same remediation message. This is the "explicit allow-list" side of the anchor — `EXTRA_WORKFLOWS` *is* the allow-list, so an unresolvable entry in it is an error, not a shrug.
- [ ] **Step 3: Watch the barrels.** In `apply()` (`:106-111`), after `this.generate()`, add the manifest + generated outputs as compilation file dependencies so rspack invalidates on change:

  ```js
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('WorkflowParserPlugin', () => {
      this.generate();
    });
    // Re-run codegen when the manifest or a generated barrel changes, so adding a
    // workflow / editing workflows.json doesn't require a full dev-server restart
    // (fable B-2). EXTRA_WORKFLOWS still needs a restart — it's an env var read at
    // process start, outside the file-watch graph; document that limitation.
    compiler.hooks.afterCompile.tap('WorkflowParserPlugin', (compilation) => {
      compilation.fileDependencies.add(this.manifestPath);
      ['index.js', 'loader.js', 'server-loader.js'].forEach((f) => {
        compilation.fileDependencies.add(path.join(this.outputDir, f));
      });
    });
  }
  ```

  Note in a comment that `EXTRA_WORKFLOWS` (an env var read once at process start) is out of scope for watch — its restart requirement stands; only `workflows.json`-driven changes get hot re-codegen.
- [ ] **Step 4: Verify both branches.**
  - *Fail-loud:* temporarily rename a symlink under `node_modules/@node-on-fhir/` for an enabled package (or set an enabled manifest entry to a bogus package), run the build, confirm it **throws** with the remediation message (not a silent 404). Restore.
  - *Watch:* boot dev, flip a workflow's `enabled` in `workflows.json`, and confirm codegen re-runs without a manual full restart (watch the `[WorkflowParser]` logs / route availability). Confirm a normal boot with a clean install still succeeds and `Validated N workflow(s): OK` prints.
- [ ] **Step 5: Commit.** `git add workflows/rspack.workflowParser.js && git commit -m "build(workflows): error (not warn) on missing enabled package + watch generated barrels"`

---

### Task 4: Decide-and-commit on mobile/offline (B-4 / B-5)

**Problem:** Mobile/offline is half-wired. `extensions/mcp/capacitor/` is a **single Capacitor plugin** (`@honeycomb/capacitor-llm`, llama.cpp on iPad — `ios/`, `src/`, `package.json`, but verified **no `capacitor.config.*`, no `www/` webdir, no app project**). `public/service-worker.js` and `client/serviceWorker.js` **exist but are never registered** — `client/main.jsx:208` has the `register('/service-worker.js', …)` call commented out (verified). No Minimongo persistence. This is a decision task: **either** stand up a real app shell + register the SW, **or** formally mark it experimental and remove the dead scaffolding. Pick one branch and execute it fully.

**Files:**
- Create: `docs/mobile-offline-decision.md` (the decision record, both branches)
- Branch A (commit): `capacitor.config.ts`, `www/`/webdir wiring, `ios/`+`android/` projects, `client/main.jsx` SW registration
- Branch B (experimental): move/annotate `public/service-worker.js`, `client/serviceWorker.js`, `extensions/mcp/capacitor/` as experimental; excise dead references

- [ ] **Step 1: Write the decision record first.** `docs/mobile-offline-decision.md` — state the two branches, the current evidence (the three missing Capacitor artifacts; the commented-out SW registration at `client/main.jsx:208`; no Minimongo persistence dep), and the chosen branch **with the rationale** (pre-BaseEHR/ONC-cert posture, deploy target, whether an offline story is a near-term requirement). This is a genuine decision — do not code before recording which branch and why. If the choice isn't obvious from context, surface it to the operator and default to **Branch B** (mark experimental) — the lower-risk, ships-less-dead-code option the fable anchor prefers.
- [ ] **Step 2A (Branch A — commit to mobile/offline):**
  - Add `capacitor.config.ts` with `webDir` pointing at the Meteor client build output; add `@capacitor/core`+`@capacitor/cli` and `npx cap add ios` / `npx cap add android` to create the app projects that wrap the Meteor client (the missing shell B-4 calls out).
  - Register the service worker: uncomment/replace `client/main.jsx:208` with a guarded `if (Meteor.isProduction && 'serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js')` (reuse `client/serviceWorker.js`'s existing `register()` — it already gates on `NODE_ENV === 'production'`, `:26`).
  - Verify the SW registers (Application tab → Service Workers) in a production build and that a `cap` build produces a runnable shell; document the offline scope (what actually works offline — likely just the app shell, not FHIR data, absent Minimongo persistence — say so honestly).
- [ ] **Step 2B (Branch B — mark experimental):**
  - Leave `client/main.jsx:208` commented but add a one-line comment pointing at `docs/mobile-offline-decision.md` explaining offline is experimental and unregistered by design.
  - Add a header comment to `public/service-worker.js` and `client/serviceWorker.js` marking them experimental/unwired (or move them under an `experimental/` path if nothing imports them — verify with a reachability grep first), and add a README stub in `extensions/mcp/capacitor/` noting it is a standalone plugin, not an app shell.
  - Ensure nothing in the live build references the unregistered SW (grep `service-worker` across `client/`, `imports/` — the only hit should be the commented line and `serviceWorker.js` itself).
- [ ] **Step 3: Verify.** Whichever branch: `meteor run` boots clean (`App running at`), no console errors about a missing/duplicate service worker, and (Branch A) the SW is active in a production build / (Branch B) no SW registers and no dead reference remains. Confirm the decision record matches the shipped state.
- [ ] **Step 4: Commit.** Branch A: `git commit -m "feat(mobile): stand up Capacitor app shell + register offline service worker"`. Branch B: `git commit -m "chore(mobile): mark mobile/offline experimental; stop shipping unwired SW scaffolding"`. Either way, include `docs/mobile-offline-decision.md`.

---

### Task 5: `lodash` pin fix + native-externalization CI smoke (B-5 cleanup / B-3 native)

**Problem:** (B-5) Root dep is `"lodash": "4.18.1"` (`package.json:111`, verified) — 4.18.x doesn't exist on npm (latest 4.x is 4.17.21), so it resolves oddly. (B-3 native) `@napi-rs/canvas`, `tesseract.js`, `pdfjs-dist/legacy/build/pdf.mjs` (pdf-parser) and `ws` are externalized via `config.externals` (`rspack.config.js:217-222`) plus a real-Node-`require` escape hatch in `PdfTextExtractor.js`, because rspack externals resolve through Meteor's modules-runtime, not Node (`:209-216`). It works but is "fragile across platforms/CI" — nothing verifies it there.

**Files:**
- Modify: `package.json:111` (the `lodash` pin)
- Create: `scripts/verify-native-externals.js` + a CI hook (or a documented `npm run` target)

- [ ] **Step 1: Fix the lodash pin.** Edit `package.json:111` `"lodash": "4.18.1"` → `"lodash": "^4.17.21"`. Run `npm install`, then `npm ls lodash` to confirm the root resolves to `4.17.21` and no workspace now has a conflicting duplicate. Boot-verify (lodash `get`/`set` are load-bearing everywhere — `App.jsx:4`, FhirDehydrator, etc.): `meteor run` to `App running at`, no `lodash` resolution errors.
- [ ] **Step 2: Write the native-externals smoke.** `scripts/verify-native-externals.js` — a Node script that, for each externalized native dep (`@napi-rs/canvas`, `tesseract.js`, `pdfjs-dist/legacy/build/pdf.mjs`, `ws`), does a real `require.resolve()` / dynamic `import()` from the project root and asserts it loads and exposes its expected surface (e.g. `canvas.createCanvas`, `Tesseract.recognize`, `ws.WebSocketServer`). This mirrors what `PdfTextExtractor.js` does at runtime (`rspack.config.js:214-216`) but as a standalone pre-flight, so a platform where the prebuilt `.node` binary is missing fails **here**, loudly, not deep in a pdf-parse request.
- [ ] **Step 3: Wire it into CI.** Add `"verify:native": "node scripts/verify-native-externals.js"` to `package.json` scripts and invoke it in the CI pipeline (the config CI uses — `.circleci`/`.github`) on the platform matrix that matters (at minimum linux-CI + the macOS desktop-build target from `desktop-lattice`). Gate it so pdf-parser's externalization is proven on every target platform before a build ships.
- [ ] **Step 4: Verify.** Run `npm run verify:native` locally — it passes for installed deps. Temporarily rename the `@napi-rs/canvas` prebuilt binary (or uninstall pdf-parser's dep) and confirm the script **fails loudly** with a clear "native dep X failed to load on <platform>" message. Restore. Confirm the CI job runs it.
- [ ] **Step 5: Commit.** `git add package.json scripts/verify-native-externals.js <ci-config> && git commit -m "fix(deps): pin lodash ^4.17.21 (was nonexistent 4.18.1) + CI smoke for native-dep externalization"`

---

## Self-review notes (applied)

- **Migration is left alone.** No task touches the workspace resolution, `validateWorkflows()`, `Package`-registry symmetry, or desktop packaging — all verified sound. The plan only addresses the two named costs (all-eager bundle, experimental mobile/offline) plus the small cleanups.
- **B-1 is owned here, not the performance plan.** Task 1 (App.jsx) + Task 2 (workflow trees) are the shared code-splitting item (fable P-7/C-6); this plan carries them, measured with the already-wired `bundle-visualizer` (`package.json:28`), before and after.
- **Every task ends with a working exemplar + boot-verify**, and defers bulk work to explicit follow-up loops (Task 1 leaves chrome eager; Task 2 converts one workflow and documents the remaining ~44 as a loop) — avoiding a big-bang rewrite of 46 packages / 190 imports.
- **Fail-loud is scoped correctly** (Task 3): only *enabled* / *EXTRA_WORKFLOWS-named* packages throw; `enabled: false` still skips silently — so the change can't break intentionally-disabled entries. Watch integration is honest about the `EXTRA_WORKFLOWS`-is-an-env-var limitation.
- **Mobile/offline is a real decision, recorded before code** (Task 4, decision-record-first), with both branches fully specified and a stated default (Branch B) matching the fable anchor's "stop shipping half-wired scaffolding" preference.
- **Anchors verified firsthand:** `App.jsx` 190 imports / 0 `React.lazy`; `dynamicRoutes` static-element array (`:594`, `:686`); `generateBarrel()` static `import * as _workflow${index}` (`:269-275`); `require.resolve()` warn-skip gates (`:42`, `:58`); `lodash: 4.18.1` (`:111`); pacio-core sole lazy npmPackage; `client/main.jsx:208` SW registration commented; capacitor plugin has no `capacitor.config`/webdir/app project; `bundle-visualizer` wired at `package.json:28`.
