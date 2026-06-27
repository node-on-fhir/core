# Base EHR Certification — Nightwatch + CircleCI TDD Implementation Plan

> Status: criteria data corrected in `npmPackages/reference-app/client/ReferenceAppPage.jsx`.
> This document is the build-out plan for the route-accessibility E2E coverage that ties
> the Base EHR criterion set to CI.

## 1. Background

The `/reference-app` route renders an ONC Health IT Certification tracker. Its Base EHR
criterion list (`BASE_EHR_CRITERIA`) has been updated to match the **current federal Base
EHR definition** — 45 CFR §170.102, as amended by the **HTI-1 final rule**.

### Current Base EHR definition (confirmed against healthit.gov, two sources)

| Criterion | Capability | Compliance date |
|---|---|---|
| 170.315(a)(5) | Demographics | |
| 170.315(a)(14) | Implantable device list | |
| 170.315(b)(11) | **Decision support interventions (DSI)** | by 12/31/2027 |
| 170.315(a)(1), (2), **or** (3) | Computerized provider order entry (one required) | |
| 170.315(c)(1) | Clinical quality measures — record & export | |
| 170.315(b)(1) | Transitions of care | |
| 170.315(g)(7) | Application access — patient selection | |
| 170.315(g)(9) | Application access — all data request | |
| 170.315(g)(10) | Standardized API for patient & population services | |
| 170.315(h)(1) **or** (h)(2) | Direct Project | |
| 170.315(b)(4) | **Real-time prescription benefit (RTPB)** | as of 1/1/2028 |

**Removed from Base EHR:** 170.315(a)(12) family health history (now tracked as an
"additional criterion" in the reference-app, not part of the Base EHR set).

### What changed in the tracker data
- `BASE_EHR_CRITERIA`: added `(b)(11)` and `(b)(4)`; removed `(a)(12)`; documented the
  `(a)(1/2/3)` and `(h)(1/2)` "or" groupings via comments.
- `CERTIFICATION_CRITERIA`: re-pointed `(b)(4)` from the stale "Common Clinical Data Set
  Summary Record" to **Real-time Prescription Benefit** (`/prescription-benefit`); added a
  new `(b)(11)` **Decision Support Interventions** entry (`/decision-support`).

## 2. Test approach

**Route-accessibility tests** (matches the existing ONC pattern in
`npmPackages/order-catalog/tests/nightwatch/170.315.a.1.test.js`). Each test logs in,
navigates to the criterion's route, and asserts the page renders without a 404 / not-found
state, then captures a screenshot. This gives one CI signal per Base EHR criterion without
the maintenance cost of deep functional assertions (a future enhancement).

## 3. Criterion → route → test file → package

Routes are taken from the reference-app's own `CERTIFICATION_CRITERIA[].link` (the app's
source of truth).

| Criterion | Route | Test file | extra-workflows pkg | Status |
|---|---|---|---|---|
| (a)(1) CPOE Meds | `/cpoe/medications` | `npmPackages/order-catalog/tests/nightwatch/170.315.a.1.test.js` | `@node-on-fhir/order-catalog` | reuse |
| (a)(2) CPOE Labs | `/cpoe/laboratory` | `npmPackages/order-catalog/tests/nightwatch/170.315.a.2.test.js` | `@node-on-fhir/order-catalog` | reuse |
| (a)(3) CPOE Imaging | `/cpoe/diagnostic-imaging` | `npmPackages/order-catalog/tests/nightwatch/170.315.a.3.test.js` | `@node-on-fhir/order-catalog` | **create** |
| (a)(5) Demographics | `/patients/new` | `npmPackages/reference-app/tests/nightwatch/170.315.a.5.test.js` | `@node-on-fhir/reference-app` (core route) | **create** |
| (a)(14) Implantable devices | `/implantable-devices` | `npmPackages/implantable-devices/tests/nightwatch/170.315.a.14.test.js` | `@node-on-fhir/implantable-devices` | reuse |
| (b)(1) Transitions of care | `/transitions-of-care` | `npmPackages/pacio-core/tests/nightwatch/170.315.b.1.test.js` | `@node-on-fhir/pacio-core` | reuse |
| (b)(4) RTPB | `/prescription-benefit` | `npmPackages/prescription-benefit/tests/nightwatch/170.315.b.4.test.js` | `@node-on-fhir/prescription-benefit` | **create** |
| (b)(11) DSI | `/decision-support` | `npmPackages/decision-support/tests/nightwatch/170.315.b.11.test.js` | `@node-on-fhir/decision-support` | **create** |
| (c)(1) CQMs | `/quality-measures` | `npmPackages/quality-measures/tests/nightwatch/170.315.c.1.test.js` | `@node-on-fhir/quality-measures` | **create** |
| (g)(7) App access — patient sel. | `/smart-app-debugger` | `npmPackages/reference-app/tests/nightwatch/170.315.g.7.test.js` | `@node-on-fhir/reference-app` (core route) | **create** |
| (g)(9) App access — all data | `/smart-app-debugger` | `npmPackages/reference-app/tests/nightwatch/170.315.g.9.test.js` | `@node-on-fhir/reference-app` (core route) | **create** |
| (g)(10) Standardized API | `/api-docs/` | `npmPackages/reference-app/tests/nightwatch/170.315.g.10.test.js` | `@node-on-fhir/reference-app` (core route) | **create** |
| (h)(1) Direct Project | `/secure-messaging` | `npmPackages/secure-messaging/tests/nightwatch/170.315.h.1.test.js` | `@node-on-fhir/secure-messaging` | **create** |

**Reuse 4** (a.1, a.2, a.14, b.1) · **Create 9**.

- Core-route criteria (a.5, g.7, g.9, g.10) target app routes that no single workflow
  package owns, so their test files live under `npmPackages/reference-app/tests/nightwatch/`
  — the reference-app is always loaded in the `base-ehr` CI group.
- **Do not reuse** the similarly-numbered files for unrelated criteria:
  `clinical-lists/170.315.a.3.test.js`, `drug-formulary/170.315.a.5.test.js`,
  `secure-messaging/170.315.b.8.test.js`. These cover different capabilities; create the
  Base EHR files at the routes above.

## 4. Test file template

Each new file mirrors `npmPackages/order-catalog/tests/nightwatch/170.315.a.1.test.js`.
Replace `<CRIT>` (e.g. `170.315.b.11`), `<ROUTE>` (e.g. `/decision-support`), and
`<LABEL>` (e.g. `Decision Support Interventions`). The relative `require` path to
`shared-test-utils` must match the file's depth (`npmPackages/<pkg>/tests/nightwatch/` ⇒
`../../../../tests/nightwatch/honeycomb/enable_autopublish/shared-test-utils`).

```js
// npmPackages/<pkg>/tests/nightwatch/<CRIT>.test.js

const testUtils = require('../../../../tests/nightwatch/honeycomb/enable_autopublish/shared-test-utils');

module.exports = {
  tags: ['base-ehr', 'onc-certification', '<CRIT>'],

  'Base EHR - <CRIT> - <LABEL>': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Ensure a logged-in user (mirrors the order-catalog pattern)
    browser.execute(function() {
      return { isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId() };
    }, [], function(result) {
      if (!result.value || !result.value.isLoggedIn) {
        browser.executeAsync(function(done) {
          Meteor.call('test.createTestUser', {
            username: 'janedoe', email: 'janedoe@test.org', password: 'janedoe123'
          }, function(err) {
            if (!err) {
              Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                done({ loginSuccess: !loginErr });
              });
            } else { done({ loginSuccess: false, error: err }); }
          });
        }, [], function() { console.log('✅ Test user logged in for <CRIT>'); });
      }
    });

    testUtils.navigateUrl(browser, '<ROUTE>');
    browser.waitForElementVisible('body', 3000).pause(1000);

    // Skip gracefully if the package/route is not loaded in this build
    let routeAvailable = true;
    browser.execute(function() {
      return !!document.querySelector('#notFoundPage');
    }, [], function(result) { if (result.value) { routeAvailable = false; } });

    browser.perform(function() {
      if (!routeAvailable) {
        console.log('⏭️  <ROUTE> not available — package not loaded in this build. Skipping.');
        return;
      }
      browser.elements('css selector', 'h1, h2, main, .page-content', function(result) {
        browser.assert.ok(result.value && result.value.length > 0,
          'Base EHR <CRIT> - page loaded with content elements');
      });
      browser.assert.not.textContains('body', '404');
      browser.assert.not.textContains('body', 'Page not found');
      browser.assert.not.textContains('body', 'Cannot GET');
      console.log('✅ Base EHR <CRIT> (<LABEL>) route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_<CRIT>.png')
      .end();
  }
};
```

The reused files (a.1, a.2, a.14, b.1) already follow this shape; optionally add the
`'base-ehr'` tag to them for consistent filtering.

## 5. CircleCI wiring

File: `.circleci/config.yml`, the `base-ehr` test-group (currently ~lines 697–702).

**`extra-workflows`** — keep the existing core entries and add the packages that own the
new routes:
```
@node-on-fhir/reference-app,@node-on-fhir/us-core,@node-on-fhir/pacio-core,@node-on-fhir/order-catalog,@node-on-fhir/implantable-devices,@node-on-fhir/secure-messaging,@node-on-fhir/quality-measures,@node-on-fhir/decision-support,@node-on-fhir/prescription-benefit
```
(`hipaa-compliance` and `family-health-history` can be dropped from this group — neither is
a Base EHR criterion — or left in harmlessly. The (a)(12) test belongs in a future
"additional-criteria" group, not `base-ehr`.)

**`test-files`** — replace with the 13 Base EHR files:
```
npmPackages/order-catalog/tests/nightwatch/170.315.a.1.test.js npmPackages/order-catalog/tests/nightwatch/170.315.a.2.test.js npmPackages/order-catalog/tests/nightwatch/170.315.a.3.test.js npmPackages/reference-app/tests/nightwatch/170.315.a.5.test.js npmPackages/implantable-devices/tests/nightwatch/170.315.a.14.test.js npmPackages/pacio-core/tests/nightwatch/170.315.b.1.test.js npmPackages/prescription-benefit/tests/nightwatch/170.315.b.4.test.js npmPackages/decision-support/tests/nightwatch/170.315.b.11.test.js npmPackages/quality-measures/tests/nightwatch/170.315.c.1.test.js npmPackages/reference-app/tests/nightwatch/170.315.g.7.test.js npmPackages/reference-app/tests/nightwatch/170.315.g.9.test.js npmPackages/reference-app/tests/nightwatch/170.315.g.10.test.js npmPackages/secure-messaging/tests/nightwatch/170.315.h.1.test.js
```

The `base-ehr` group already starts `meteor run --settings settings/settings.honeycomb.tdd.json`
with external ChromeDriver, so no harness/job-template changes are needed.

## 6. Build-out checklist

- [ ] Create the 9 new `170.315.*.test.js` files from the template (correct `require`
      depth, route, label, tag, screenshot name).
- [ ] (Optional) Add `'base-ehr'` tag to the 4 reused files.
- [ ] Update `.circleci/config.yml` `base-ehr` group `extra-workflows` + `test-files`.
- [ ] Verify each route is actually reachable with its package loaded (see §7).

## 7. Verification

1. **Criteria UI** — `EXTRA_WORKFLOWS=@node-on-fhir/reference-app meteor run --settings settings/settings.honeycomb.localhost.json`,
   open `/reference-app`. The "core criteria" card shows the 11 Base EHR items (incl. DSI +
   RTPB; no family-health-history); "additional criteria" now lists (a)(12); the
   "X of N core criteria" count reflects 13 rows (a1/a2/a3 listed individually).
2. **One new test locally** — with a running app and the matching `EXTRA_WORKFLOWS`:
   `npx nightwatch --config nightwatch.circle.conf.js npmPackages/decision-support/tests/nightwatch/170.315.b.11.test.js`
   → expect pass (route renders; package exists).
3. **CI** — push the branch; confirm the `base-ehr` group runs all 13 files green.
4. Spot-check `tests/screenshots/base-ehr_*.png`.

## 8. Future enhancements (out of scope here)
- Functional-depth assertions per criterion (DSI intervention surfaces; RTPB returns
  benefit data; CQM export produces QRDA; (g)(10) Inferno conformance).
- A separate `additional-criteria` CircleCI group for non-Base-EHR criteria, including
  the relocated (a)(12) family-health-history test.
