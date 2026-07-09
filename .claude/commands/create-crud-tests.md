# Slash Command: /create-crud-tests

Generate a complete 9-test Nightwatch CRUD test file for a FHIR resource following established patterns, adapted to resource archetype.

## Description

This command creates a full test file that follows battle-tested patterns, automatically adapting to the resource archetype:

1. **Patient-Agnostic Resources** - No patient context, global data
2. **Patient-Owned Resources** - Requires patient selection and filtering
3. **Clinician-Mediated Resources** - Requires practitioner login and patient context

## Usage

```
/create-crud-tests Observation
/create-crud-tests Medication --archetype=patient-agnostic
/create-crud-tests ServiceRequest --archetype=clinician-mediated
/create-crud-tests Coverage --non-interactive
```

## Non-Interactive Mode (Ralph Loops & Agent Orchestration)

This command must be runnable **without any human in the loop** — it is invoked
by `/ralph-fhir-loop` iterations and by orchestrating agents.

**Run non-interactively when ANY of these is true:**
- `--non-interactive` flag is passed
- A Ralph loop is active (`.claude/ralph-loop.local.md` exists)
- You are executing as a subagent (dispatched via the Agent tool)

**In non-interactive mode, do NOT use AskUserQuestion.** Resolve the
"Interactive Prompts" below from defaults:

| Prompt | Non-interactive resolution |
|--------|---------------------------|
| Resource name | Required argument; if absent, take the next `⏳ pending` row from `FHIR_RESOURCES_MANIFEST.md` |
| Archetype | `--archetype` flag → manifest `Ownership` column → ARCHETYPE_MAP below |
| Test data fields | Required fields from `imports/lib/schemas/R4B/JsonSchema/{Resource}.json` + the fields the Detail form actually renders (read the generated `{ResourceType}Detail.jsx`) |
| Login strategy | Always `loginHelper.ensureLoggedIn()` — it creates/logs in the `janedoe` account automatically; no per-archetype account selection needed |

Generation is **idempotent**: if the test file already exists, improve it in
place (fill assertion gaps per the two-pass strategy below) instead of
overwriting it.

### Two-Pass Assertion Strategy (matches /ralph-fhir-loop Phase 3)

- **Pass 1** — scaffold all 9 tests with 1–2 assertions each; get the workflow
  green end-to-end first.
- **Pass 2** — lock down with comprehensive assertions (~60 total, distribution
  table in `/ralph-fhir-loop` Step 3.4), based on the JSONSchema fields.

### Delegating to Subagents

- `fhir-schema-expert` — required-field and cardinality questions
- `test-stabilizer` — dispatch when a generated test flakes (timing, MUI portals, click interception)
- The test file for one resource is independent of other resources' test files — an orchestrator may generate several resources' tests in parallel, but **run** them serially against the single shared Meteor server on port 3000.

## Canonical Helpers (REQUIRED in every generated test)

```javascript
// tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js
const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');
```

- **Login**: `loginHelper.ensureLoggedIn(browser, callback)` — there is no
  `testUtils.login()`. Do NOT hand-roll `#loginUsername` form fills.
- **Navigation**: `testUtils.navigateUrl(browser, '/path')` — preserves Session
  (uses `Meteor.navigate`); `browser.url()` clears it.
- **Patient creation**: `testUtils.createTestPatient(browser, {name, family, given, gender, birthDate, identifier}, callback)` — object form with named params.
- **Session keys**: set `Session.set('selectedPatientId', patient._id)` (MongoDB
  `_id`, not FHIR `id`) plus `Session.set('selectedPatient', patient)`.

## Resource Archetypes

### 1. Patient-Agnostic Resources

**Examples:** Organization, Substance, Medication, NutritionProduct, Location, Practitioner

**Characteristics:**
- ❌ No patient context required
- ✅ Global/shared data accessible by all users
- ✅ Any authenticated user can CRUD
- ❌ No patient filtering in queries
- ✅ Simple login (janedoe or any user)

**Test Pattern:**
- Test 01: Login only (no patient creation)
- Test 02: Navigate to list (no Session restoration)
- Tests 03-09: Standard CRUD (no patient references)

### 2. Patient-Owned Resources

**Examples:** Condition, Procedure, AllergyIntolerance, Observation, Immunization, CarePlan, Encounter

**Characteristics:**
- ✅ Requires patient context
- ✅ Scoped to selected patient
- ✅ Patient reference in resource
- ✅ Uses `FhirUtilities.addPatientFilterToQuery()`
- ✅ Standard user login (janedoe)

**Test Pattern:**
- Test 01: Login + create patient + set Session
- Test 02: Navigate + restore Session
- Tests 03-09: CRUD with patient context
- Tests 07-09: Re-establish patient context

### 3. Clinician-Mediated Resources

**Examples:** ServiceRequest, NutritionOrder, MedicationRequest, CommunicationRequest

**Characteristics:**
- ✅ Requires practitioner context
- ✅ Requires patient context
- ✅ May need practitioner role/permissions
- ✅ Practitioner as author/requester
- ✅ Patient as subject
- ⚠️ May require different login (practitioner account)

**Test Pattern:**
- Test 01: Practitioner login + create patient + set contexts
- Test 02: Navigate + restore Session (patient + practitioner)
- Tests 03-09: CRUD with both contexts
- Verify practitioner auto-populated as requester/author

## Interactive Prompts

**Skip this entire section in non-interactive mode** (see above) — use the
defaults table instead.

The command will ask:

1. **Resource name** (if not provided)
   ```
   What FHIR resource? (e.g., Observation, Medication, ServiceRequest)
   ```

2. **Archetype detection** (with smart default)
   ```
   Detected archetype: Patient-Owned (based on resource type)

   Is this correct?
   a) Yes, Patient-Owned (requires patient context)
   b) No, Patient-Agnostic (global data, no patient)
   c) No, Clinician-Mediated (requires practitioner + patient)
   ```

3. **Test data fields** (adapted to archetype)
   ```
   What fields should the test data include?

   [Patient-Agnostic]
   - name/display (identifier)
   - status
   - type/category

   [Patient-Owned]
   - code (if coded)
   - status (required)
   - patient reference (auto-added)
   - effectiveDateTime / issued

   [Clinician-Mediated]
   - code/orderDetail
   - status (draft → active)
   - patient reference (subject)
   - practitioner reference (requester - auto-populated)
   - authoredOn (timestamp)
   ```

4. **Login strategy**

   All archetypes use `loginHelper.ensureLoggedIn()` (creates/logs in the
   `janedoe` test account automatically). The only question is whether the
   test additionally needs to resolve a Practitioner record for the logged-in
   user (clinician-mediated archetypes do; see the example below).

## Example Output: Patient-Owned Resource

```javascript
// tests/nightwatch/honeycomb/enable_autopublish/crud.observations.js
const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Observations CRUD Operations [Patient-Owned]', function() {
  const timestamp = Date.now();
  let testPatientId = null;

  const testObservation = {
    resourceType: 'Observation',
    code: '85354-9',
    codeDisplay: 'Blood pressure panel',
    status: 'final',
    effectiveDateTime: '2024-01-15',
    valueQuantity: '120',
    valueUnit: 'mmHg',
    category: 'vital-signs',
    notes: `Test observation ${timestamp}`
  };

  // ... (full test as shown previously)
});
```

## Example Output: Patient-Agnostic Resource

```javascript
// tests/nightwatch/honeycomb/enable_autopublish/crud.medications.js
const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Medications CRUD Operations [Patient-Agnostic]', function() {
  const timestamp = Date.now();
  // ❌ No testPatientId - not needed!

  const testMedication = {
    resourceType: 'Medication',
    code: 'rxcui-123456',
    display: `Test Medication ${timestamp}`,
    status: 'active',
    form: 'tablet',
    manufacturer: 'Test Pharma Inc'
  };

  before(browser => {
    browser
      .windowSize('current', 1400, 900)
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  it('01. Setup test environment', browser => {
    // Simple login - no patient creation
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }
    });

    console.log('[Test 01] Logged in. No patient context needed.');
  });

  it('02. Verify {resourceType} list page loads', browser => {
    browser
      .url('http://localhost:3000/medications')
      .waitForElementVisible('#medicationsPage', 5000);

    // ❌ No Session restoration - no patient context!

    browser.execute(function() {
      const hasTable = document.querySelector('#medicationsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null;
      return { hasTable, hasNoData };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasTable || result.value.hasNoData,
        'Either table or no-data state visible'
      );
    });
  });

  it('03. Navigate to create form', browser => {
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') || button.textContent.includes('New')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationDetailPage', 5000)
      .waitForElementVisible('#codeInput', 5000)
      .waitForElementVisible('#displayInput', 5000);
  });

  it('04. Create new medication', browser => {
    browser
      .clearValue('#codeInput')
      .setValue('#codeInput', testMedication.code)
      .clearValue('#displayInput')
      .setValue('#displayInput', testMedication.display)
      .pause(500);

    // Status select
    browser.execute(function(statusValue) {
      const select = document.querySelector('#statusSelect');
      if (select) {
        select.click();
        setTimeout(() => {
          const options = document.querySelectorAll('[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === statusValue) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMedication.status]);

    browser.pause(500);

    // Save
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    browser
      .pause(2000)
      .waitForElementVisible('#medicationsPage', 5000);
  });

  it('05. Verify creation', browser => {
    // Search by display name
    browser
      .waitForElementVisible('#medicationSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#medicationSearchInput');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [testMedication.display])
      .pause(3000);

    browser.assert.containsText('#medicationsTable', testMedication.display);
  });

  it('06. View details', browser => {
    browser.execute(function() {
      const rows = document.querySelectorAll('#medicationsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationDetailPage', 5000)
      .getValue('#displayInput', function(result) {
        browser.assert.equal(result.value, testMedication.display);
      });
  });

  it('07. Update medication', browser => {
    // ❌ No patient context re-establishment!

    testUtils.navigateUrl(browser, '/medications');
    browser.waitForElementVisible('#medicationsPage', 5000);

    // Search and click
    browser
      .execute(function(searchValue) {
        const input = document.querySelector('#medicationSearchInput');
        if (input) {
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [testMedication.display])
      .pause(2000);

    browser.execute(function() {
      const rows = document.querySelectorAll('#medicationsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
      }
    });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationDetailPage', 5000);

    // Edit
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          button.click();
          return true;
        }
      }
    });

    browser.pause(500);

    const updatedManufacturer = `Updated Pharma ${Date.now()}`;
    browser
      .clearValue('#manufacturerInput')
      .setValue('#manufacturerInput', updatedManufacturer)
      .pause(500);

    // Save
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
          button.click();
          return true;
        }
      }
    });

    browser.pause(2000);
  });

  it('08. Delete medication', browser => {
    browser
      .waitForElementVisible('#medicationDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Delete')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    browser
      .pause(500)
      .acceptAlert()
      .pause(1000)
      .waitForElementVisible('#medicationsPage', 5000);
  });

  it('09. Cleanup', browser => {
    console.log('[Test 09] Test complete. No patient cleanup needed.');
  });

  after(browser => {
    browser.end();
  });
});
```

## Example Output: Clinician-Mediated Resource

```javascript
// tests/nightwatch/honeycomb/enable_autopublish/crud.servicerequests.js
const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('ServiceRequests CRUD Operations [Clinician-Mediated]', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testPractitionerId = null; // Also track practitioner!

  const testServiceRequest = {
    resourceType: 'ServiceRequest',
    code: 'lab-order-123',
    display: `Test Lab Order ${timestamp}`,
    status: 'draft', // Start as draft
    intent: 'order',
    priority: 'routine',
    authoredOn: '2024-01-15',
    notes: `Test service request ${timestamp}`
  };

  before(browser => {
    browser
      .windowSize('current', 1400, 900)
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  it('01. Setup test environment', browser => {
    // Login as practitioner (janedoe has practitioner role)
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      }
    });

    // Get practitioner ID from logged-in user
    browser.execute(function() {
      const userId = get(Meteor, 'userId()');
      // Assuming user has linked practitioner
      const practitioner = Practitioners.findOne({'user.reference': 'User/' + userId});
      return practitioner ? practitioner._id : null;
    }, [], function(result) {
      testPractitionerId = result.value;
      console.log('[Test 01] Practitioner ID:', testPractitionerId);
    });

    // Create test patient
    testUtils.createTestPatient(browser, {
      name: 'Test Patient SR',
      family: 'Patient',
      given: 'Test',
      identifier: 'test-patient-sr-' + timestamp
    }, function(result) {
      testPatientId = result.result;
      console.log('[Test 01] Created patient:', testPatientId);

      // Fetch and set in Session
      browser.executeAsync(function(patientId, done) {
        if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
          Meteor.call('patients.findOne', patientId, function(error, patient) {
            if (patient) {
              Session.set('selectedPatientId', patient._id);
              Session.set('selectedPatient', patient);
              console.log('[Test 01] Set patient in Session');
              done({ success: true });
            } else {
              done({ success: false });
            }
          });
        }
      }, [result.result]);
    });
  });

  it('02. Verify {resourceType} list page loads', browser => {
    browser
      .url('http://localhost:3000/service-requests')
      .waitForElementVisible('#serviceRequestsPage', 5000);

    // Restore patient context
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            done({ success: true });
          }
        });
      }
    }, [testPatientId]);

    browser.pause(500);

    browser.execute(function() {
      const hasTable = document.querySelector('#serviceRequestsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null;
      return { hasTable, hasNoData };
    }, [], function(result) {
      browser.assert.ok(result.value.hasTable || result.value.hasNoData);
    });
  });

  it('03. Navigate to create form', browser => {
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') || button.textContent.includes('New')) {
          button.click();
          return true;
        }
      }
    });

    browser
      .pause(1000)
      .waitForElementVisible('#serviceRequestDetailPage', 5000);

    // IMPORTANT: Verify requester auto-populated with practitioner
    browser.execute(function() {
      const requesterDisplay = document.querySelector('#requesterDisplayInput');
      if (requesterDisplay) {
        return {
          hasRequester: requesterDisplay.value.length > 0,
          requesterValue: requesterDisplay.value
        };
      }
      return { hasRequester: false };
    }, [], function(result) {
      console.log('[Test 03] Requester auto-populated:', result.value);
      browser.assert.ok(result.value.hasRequester, 'Requester should be auto-populated');
    });
  });

  it('04. Create new service request', browser => {
    browser
      .clearValue('#codeInput')
      .setValue('#codeInput', testServiceRequest.code)
      .clearValue('#displayInput')
      .setValue('#displayInput', testServiceRequest.display)
      .pause(500);

    // Status (draft)
    browser.execute(function(statusValue) {
      const select = document.querySelector('#statusSelect');
      if (select) {
        select.click();
        setTimeout(() => {
          const options = document.querySelectorAll('[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === statusValue) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testServiceRequest.status]);

    browser
      .pause(500)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testServiceRequest.notes)
      .pause(500);

    // Save
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save')) {
          button.click();
          return true;
        }
      }
    });

    browser
      .pause(2000)
      .waitForElementVisible('#serviceRequestsPage', 5000);
  });

  it('05. Verify creation', browser => {
    // Search
    browser
      .waitForElementVisible('#serviceRequestSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#serviceRequestSearchInput');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [testServiceRequest.display])
      .pause(3000);

    browser.assert.containsText('#serviceRequestsTable', testServiceRequest.display);

    // Verify practitioner is listed as requester in table
    browser.execute(function() {
      const table = document.querySelector('#serviceRequestsTable');
      return table ? table.textContent : '';
    }, [], function(result) {
      console.log('[Test 05] Table includes requester:', result.value.includes('janedoe'));
    });
  });

  it('06. View details', browser => {
    browser.execute(function() {
      const rows = document.querySelectorAll('#serviceRequestsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
      }
    });

    browser
      .pause(1000)
      .waitForElementVisible('#serviceRequestDetailPage', 5000)
      .getValue('#displayInput', function(result) {
        browser.assert.equal(result.value, testServiceRequest.display);
      });

    // Verify requester field shows practitioner
    browser.getValue('#requesterDisplayInput', function(result) {
      console.log('[Test 06] Requester:', result.value);
      browser.assert.ok(result.value.length > 0, 'Requester should be populated');
    });
  });

  it('07. Update service request', browser => {
    // Re-establish patient context
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            done({ success: true });
          }
        });
      }
    }, [testPatientId]);

    browser.pause(1000);

    testUtils.navigateUrl(browser, '/service-requests');
    browser.waitForElementVisible('#serviceRequestsPage', 5000);

    browser
      .execute(function(searchValue) {
        const input = document.querySelector('#serviceRequestSearchInput');
        if (input) {
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, [testServiceRequest.display])
      .pause(2000);

    browser.execute(function() {
      const rows = document.querySelectorAll('#serviceRequestsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
      }
    });

    browser
      .pause(1000)
      .waitForElementVisible('#serviceRequestDetailPage', 5000);

    // Edit
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          button.click();
          return true;
        }
      }
    });

    browser.pause(500);

    // Change status to 'active'
    browser.execute(function(statusValue) {
      const select = document.querySelector('#statusSelect');
      if (select) {
        select.value = statusValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, ['active']);

    browser.pause(500);

    // Save
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
          button.click();
          return true;
        }
      }
    });

    browser.pause(2000);

    // Verify status changed
    browser.execute(function() {
      const select = document.querySelector('#statusSelect');
      return select ? select.value : null;
    }, [], function(result) {
      browser.assert.equal(result.value, 'active', 'Status updated to active');
    });
  });

  it('08. Delete service request', browser => {
    browser
      .waitForElementVisible('#serviceRequestDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Delete')) {
          button.click();
          return true;
        }
      }
    });

    browser
      .pause(500)
      .acceptAlert()
      .pause(1000)
      .waitForElementVisible('#serviceRequestsPage', 5000);
  });

  it('09. Cleanup', browser => {
    console.log('[Test 09] Test complete.');
    console.log('  Patient:', testPatientId);
    console.log('  Practitioner:', testPractitionerId);
  });

  after(browser => {
    browser.end();
  });
});
```

## Archetype Detection Logic

The command uses smart defaults based on resource name:

```javascript
const ARCHETYPE_MAP = {
  // Patient-Agnostic
  'Organization': 'patient-agnostic',
  'Location': 'patient-agnostic',
  'Practitioner': 'patient-agnostic',
  'PractitionerRole': 'patient-agnostic',
  'Substance': 'patient-agnostic',
  'Medication': 'patient-agnostic',
  'NutritionProduct': 'patient-agnostic',
  'Device': 'patient-agnostic',

  // Patient-Owned
  'Patient': 'patient-owned', // Special case
  'Condition': 'patient-owned',
  'Procedure': 'patient-owned',
  'AllergyIntolerance': 'patient-owned',
  'Observation': 'patient-owned',
  'Immunization': 'patient-owned',
  'CarePlan': 'patient-owned',
  'Encounter': 'patient-owned',
  'DiagnosticReport': 'patient-owned',
  'DocumentReference': 'patient-owned',
  'Consent': 'patient-owned',
  'Communication': 'patient-owned',
  'Goal': 'patient-owned',

  // Clinician-Mediated
  'ServiceRequest': 'clinician-mediated',
  'MedicationRequest': 'clinician-mediated',
  'NutritionOrder': 'clinician-mediated',
  'CommunicationRequest': 'clinician-mediated',
  'Task': 'clinician-mediated',
  'Appointment': 'clinician-mediated'
};
```

## Key Differences by Archetype

| Aspect | Patient-Agnostic | Patient-Owned | Clinician-Mediated |
|--------|------------------|---------------|---------------------|
| **Test 01 Setup** | Login only | Login + create patient | Login (practitioner) + create patient |
| **Patient Context** | ❌ Not needed | ✅ Required | ✅ Required |
| **Session Management** | ❌ Not needed | ✅ Required (restore in test 02, 07-09) | ✅ Required |
| **Practitioner Context** | ❌ Not tracked | ❌ Not tracked | ✅ Track practitioner ID |
| **Resource Reference** | None | `subject: { reference: 'Patient/[id]' }` | `subject: Patient/[id]`<br/>`requester: Practitioner/[id]` |
| **Auto-Populated Fields** | None | Patient (from Session) | Patient + Practitioner |
| **Test 03 Verification** | Form fields only | Form + patient field | Form + patient + verify requester |
| **Search Strategy** | Global search | Patient-scoped search | Patient-scoped search |
| **Authorization** | Any authenticated user | User with patient access | Practitioner role required |

## Customization Options

When generating, the command adapts to:

1. **Resource archetype** (auto-detected or specified)
2. **Required fields per resource** (consults FHIR R4B spec)
3. **Login account** (standard user vs practitioner)
4. **Search strategy** (code, text, or display)
5. **Status transitions** (draft → active for orders)

## Output Location

```
tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js
```

(Resource name lowercased, no separators — e.g. `crud.clinicalimpressions.js`.)

After the tests pass, register the file in `.circleci/config.yml` (both the
parameters test-groups array AND the workflows section) — see
`/ralph-fhir-loop` Phase 7.5 for the resource-type → test-group mapping.

## Related Commands

- Use `/create-crud-microservice {Resource}` first if the implementation doesn't exist yet
- Use `/ralph-fhir-loop` to run the full generate → test → fix loop unattended
- Use `/add-patient-context-to-tests` to retrofit existing patient-owned tests
- See `.claude/rules/testing/crud-patterns.md` for full patterns
- See `test-stabilizer` subagent for debugging

---

**Note:** Archetype-aware testing ensures proper access patterns for different resource types.
