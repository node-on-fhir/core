---
allowedPrompts:
  # Test execution
  - tool: Bash
    prompt: "run nightwatch tests"
  - tool: Bash
    prompt: "run npm tests"

  # Server management
  - tool: Bash
    prompt: "start meteor server"
  - tool: Bash
    prompt: "kill meteor processes"
  - tool: Bash
    prompt: "check port status"

  # Log and file inspection
  - tool: Bash
    prompt: "check server logs"
  - tool: Bash
    prompt: "list files and directories"
  - tool: Bash
    prompt: "read file contents"
  - tool: Bash
    prompt: "search file contents"

  # Directory operations
  - tool: Bash
    prompt: "create directories"

  # Output and validation
  - tool: Bash
    prompt: "redirect output to file"
  - tool: Bash
    prompt: "validate syntax"

  # Browser
  - tool: Bash
    prompt: "open browser to localhost"
---

# Ralph Wiggum FHIR Microservice Loop

> "Me fail English? That's unpossible!" - Ralph Wiggum
>
> This loop keeps running until all tests pass. It's unpossible to fail.

## Slash Command

```
/ralph-fhir-loop
```

## Pre-Approved Commands

The following bash commands are pre-approved and don't require confirmation:

```bash
# Run tests against running server (most common)
npx nightwatch tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js --config nightwatch.conf.js

# Run tests with CircleCI config
npx nightwatch --config nightwatch.circle.conf.js tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js

# Run tests with verbose output
npx nightwatch tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js --config nightwatch.conf.js --verbose

# Check server logs
tail -100 /tmp/meteor-server.log

# View recent test screenshots
ls -la tests/nightwatch/screenshots/{resources}/

# Check if server is running
curl -s http://localhost:3000 > /dev/null && echo "Server running" || echo "Server not running"

# Kill stuck processes
pkill -f "meteor run" || true
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
```

## Overview

Automated loop to implement a complete FHIR R4B microservice for a single resource type. Run nightly, one resource at a time.

---

## PHASE 1: STARTUP

### Step 1.0: Pre-Flight Checklist

Before starting, clean up any existing processes:

```bash
# Kill existing Meteor processes
pkill -f "meteor run" || true

# Clear ports 3000 and 8080
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
```

### Step 1.1: Interactive Prompts

Ask the user these questions using AskUserQuestion:

1. **Which FHIR resource type?** (e.g., BodyStructure, AdverseEvent, Coverage)
2. **Ownership model?**
   - `patient-agnostic` - No patient context needed (Medication, Organization, etc.)
   - `patient-owned` - Requires patient context (Observation, Condition, etc.)
   - `clinician-mediated` - Patient + practitioner context (MedicationRequest, ServiceRequest)
   - `workflow` - Multi-actor financial/admin (Claim, Coverage)
3. **Confirm key fields** - Show fields from JSONSchema, let user confirm/modify

### Step 1.2: Launch Background Services

**CRITICAL**: Use the correct server startup command:

```bash
# Start server with auto-login enabled (uses configs/settings.honeycomb.tdd.json)
meteor npm run medical-home-autologin > /tmp/meteor-server.log 2>&1 &
```

Wait for server to be ready:
```bash
for i in {1..60}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Server ready after ${i} seconds!"
    break
  fi
  sleep 2
done
```

**Settings File Note**: The `medical-home-autologin` script uses `configs/settings.honeycomb.tdd.json`, NOT `settings.honeycomb.localhost.json`. Ensure new resources are enabled in the TDD settings file.

---

## PHASE 2: SCHEMA

### Step 2.1: Fetch JSONSchema from HL7

**IMPORTANT**: The direct `.schema.json` URL often returns StructureDefinition format, NOT JSONSchema. Use the `.schema.json.html` page instead.

```bash
# Create directory if needed
mkdir -p imports/lib/schemas/R4B/JsonSchema

# WRONG: This URL returns StructureDefinition (43,000+ tokens, wrong format)
# curl https://hl7.org/fhir/R4B/{resource}.schema.json

# CORRECT: Extract JSONSchema from the HTML page
# 1. Visit: https://hl7.org/fhir/R4B/{resource}.schema.json.html
# 2. Copy the JSON content from the code block
# 3. Save to: imports/lib/schemas/R4B/JsonSchema/{Resource}.json
```

**Format Verification**: Correct JSONSchema starts with:
```json
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "id": "http://hl7.org/fhir/json-schema/{Resource}",
  ...
}
```

Wrong format (StructureDefinition) starts with:
```json
{
  "resourceType": "StructureDefinition",
  ...
}
```

### Step 2.2: Analyze Schema

Read the downloaded JSONSchema and extract:
- Required fields
- Field types (string, boolean, CodeableConcept, Reference, etc.)
- Reference targets (e.g., `Reference(Patient)`)
- Cardinality (arrays vs single values)

### Step 2.3: Store Schema Analysis

Document key fields for test generation and UI creation:
```
Resource: {ResourceType}
Ownership: {patient-agnostic|patient-owned|clinician-mediated|workflow}

Required Fields:
- resourceType: "{ResourceType}"
- {field}: {type}

Optional Fields:
- {field}: {type} ({description})

References:
- {field}: Reference({TargetResource})
```

---

## PHASE 3: TDD TEST CREATION

### Step 3.1: Generate Test File

Create `tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js`

Use the appropriate archetype pattern:

#### Patient-Agnostic Pattern
```javascript
describe('{ResourceTypes} CRUD Operations', function() {
  const timestamp = Date.now();
  let testRecordId = null;

  it('01. Setup test environment', browser => {
    // Login only, no patient creation
  });
  // ... tests 02-09
});
```

#### Patient-Owned Pattern
```javascript
describe('{ResourceTypes} CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testRecordId = null;

  it('01. Setup test environment', browser => {
    // Login + create test patient + set Session
  });
  // ... tests 02-09 with patient context restoration
});
```

#### Clinician-Mediated Pattern
```javascript
describe('{ResourceTypes} CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testRecordId = null;

  it('01. Setup test environment', browser => {
    // Login as practitioner + create test patient + set both Sessions
  });
  // ... tests 02-09 with requester auto-population
});
```

### Step 3.2: 9-Test Standard Pattern

1. **01. Setup test environment** - Login, create patient (if needed), set Session
2. **02. Verify list page loads** - Navigate, check table/no-data state
3. **03. Verify table search** - Test search input, filter results
4. **04. Navigate to create form** - Click "New" button, verify form
5. **05. Create new record** - Fill form, submit, capture ID
6. **06. Verify new record in table** - Search, find new record
7. **07. Open record for editing** - Click row, verify detail page
8. **08. Update record** - Edit fields, save, verify changes
9. **09. Delete record** - Delete, confirm, verify removal

### Step 3.3: Key Test Patterns

**Login Helper (NOT testUtils.login):**
```javascript
const loginHelper = require('../../helpers/login-helper');

loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
  if (!isLoggedIn) {
    browser.assert.fail('Failed to ensure user is logged in');
  }
  // ... continue with test
});
```

**Create Test Patient (Object format with named params):**
```javascript
testUtils.createTestPatient(browser, {
  name: '{ResourceType} TestPatient',
  family: 'TestPatient',
  given: '{ResourceType}',
  gender: 'male',
  birthDate: '1985-05-15',
  identifier: 'test-{resourcetype}-patient-' + timestamp
}, function(result) {
  testPatientId = result.result;
  // ... set Session
});
```

**Session Restoration (patient-owned resources):**
```javascript
browser.executeAsync(function(patientId, done) {
  Meteor.call('patients.findOne', patientId, function(error, patient) {
    Session.set('selectedPatient', patient);
    Session.set('selectedPatientId', patient._id);  // Use _id not id
    done({ success: true });
  });
}, [testPatientId]);
```

**Navigation (CRITICAL - Use testUtils.navigateUrl):**
```javascript
// CORRECT - Preserves Session
testUtils.navigateUrl(browser, '/{resourceTypes}');

// WRONG - Clears Session, must restore manually
browser.url('http://localhost:3000/{resourceTypes}');
```

**Search Input (React forms):**
```javascript
browser.execute(function(value) {
  const input = document.querySelector('#searchInput');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, [searchTerm]);
browser.pause(3000); // Wait for subscription
```

**Material-UI Select:**
```javascript
browser.execute(function(value) {
  document.querySelector('#statusSelect').click();
  setTimeout(function() {
    document.querySelector(`[data-value="${value}"]`).click();
  }, 500);
}, [statusValue]);
```

### Step 3.4: Two-Pass Test Assertion Strategy

The 9-test CRUD pattern requires comprehensive assertions (~60 total per resource type).

**Pass 1: Scaffold the Workflow**
- Create all 9 tests with basic assertions (1-2 per test)
- Focus on getting the workflow running end-to-end
- Verify: navigation works, forms submit, data persists

**Pass 2: Lock Down with Comprehensive Assertions**
- After workflow is green, add comprehensive assertions
- Target: ~60 assertions across 9 tests
- Base assertions on JSONSchema fields:
  - Every form field has `.assert.elementPresent('#fieldId')`
  - Every field value is verified with `.getValue()` + `.assert.ok()`
  - URL assertions at navigation points
  - Table content assertions with row counts
  - Execute block callbacks include `browser.assert.equal()` and `browser.assert.ok()`

**Assertion Distribution (Target):**
| Test | Description | Target Assertions |
|------|-------------|-------------------|
| 01 | Setup | 3-5 |
| 02 | List Page | 4-6 |
| 03 | New Form | 8-12 (form field presence) |
| 04 | Create | 8-12 (field values, save success) |
| 05 | Verify in List | 4-6 |
| 06 | View Details | 10-15 (all field values) |
| 07 | Update | 10-15 (edit mode, field updates) |
| 08 | Verify Update | 3-5 |
| 09 | Delete | 5-8 |

**Example comprehensive assertion patterns:**
```javascript
// Form field presence assertions
browser
  .assert.elementPresent('#descriptionInput')
  .assert.elementPresent('#summaryInput')
  .assert.elementPresent('#statusSelect')
  .assert.elementPresent('#subjectDisplay');

// Value verification assertions
browser.getValue('#descriptionInput', function(result) {
  browser.assert.ok(result.value.includes('expected text'), 'Description contains expected text');
});

// Execute block callback assertions
browser.execute(function() {
  const status = document.querySelector('#statusSelect');
  const rows = document.querySelectorAll('#table tbody tr');
  return { statusValue: status?.value, rowCount: rows.length };
}, [], function(result) {
  browser.assert.equal(result.value.statusValue, 'completed', 'Status is completed');
  browser.assert.ok(result.value.rowCount > 0, 'Table has rows');
});

// URL assertions
browser.assert.urlContains('/clinicalimpressions/');
browser.assert.urlContains('/new');
```

---

## PHASE 4: MICROSERVICE IMPLEMENTATION

### Step 4.1: Collection + Schema

Create `imports/lib/schemas/SimpleSchemas/{ResourceTypes}.js`:
```javascript
import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';

export const {ResourceTypes} = new Mongo.Collection('{ResourceTypes}');

const {ResourceType}Schema = new SimpleSchema({
  resourceType: { type: String, defaultValue: '{ResourceType}' },
  _id: { type: String, optional: true },
  id: { type: String, optional: true },
  // ... fields from JSONSchema analysis
});

{ResourceTypes}.attachSchema({ResourceType}Schema);
```

### Step 4.2: Collection Registration (3 places)

**server/main.js:**
```javascript
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

Meteor.Collections.{ResourceTypes} = {ResourceTypes};
global.Collections.{ResourceTypes} = {ResourceTypes};
```

**imports/startup/client/collections.js:**
```javascript
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

Meteor.Collections.{ResourceTypes} = {ResourceTypes};
```

**server/publications/autopublish.js:**
```javascript
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

// Add to collectionsMap
'{ResourceTypes}': {ResourceTypes}
```

### Step 4.3: Meteor Methods

Create `imports/api/{resourceTypes}/methods.js`:
```javascript
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';
import { get } from 'lodash';
import { Random } from 'meteor/random';

Meteor.methods({
  '{resourceTypes}.insert': async function(data) {
    check(data, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const record = {
      resourceType: '{ResourceType}',
      id: Random.id(),
      // ... map fields
    };
    record._id = record.id;

    return await {ResourceTypes}.insertAsync(record);
  },

  '{resourceTypes}.update': async function(id, data) {
    check(id, String);
    check(data, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    return await {ResourceTypes}.updateAsync({ _id: id }, { $set: data });
  },

  '{resourceTypes}.remove': async function(id) {
    check(id, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    return await {ResourceTypes}.removeAsync({ _id: id });
  },

  '{resourceTypes}.findOne': async function(id) {
    check(id, String);
    return await {ResourceTypes}.findOneAsync({ _id: id });
  }
});
```

Import in server/main.js:
```javascript
import '/imports/api/{resourceTypes}/methods';
```

### Step 4.4: UI Components

Create directory: `imports/ui-fhir/{resourceTypes}/`

**{ResourceTypes}Page.jsx** - List view with search/filter
**{ResourceTypes}Table.jsx** - Table component
**{ResourceType}Detail.jsx** - Create/Edit form

Use existing patterns from:
- Patient-agnostic: `imports/ui-fhir/medications/`
- Patient-owned: `imports/ui-fhir/observations/`
- Clinician-mediated: `imports/ui-fhir/medicationRequests/`

### Step 4.5: Routes

Add to `imports/ui/App.jsx`:
```javascript
import {ResourceTypes}Page from '/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page';
import {ResourceType}Detail from '/imports/ui-fhir/{resourceTypes}/{ResourceType}Detail';

// In routes:
<Route path="/{resourceTypes}" element={<{ResourceTypes}Page />} />
<Route path="/{resourceTypes}/new" element={<{ResourceType}Detail />} />
<Route path="/{resourceTypes}/:id" element={<{ResourceType}Detail />} />
```

### Step 4.6: FhirDehydrator

Add to `imports/lib/FhirDehydrator.js` in THREE places:

**1. Create the flatten function (around line 840+):**
```javascript
export function flatten{ResourceType}(record, internalDateFormat) {
  let result = {
    _id: get(record, '_id', ''),
    id: get(record, 'id', ''),
    resourceType: '{ResourceType}',
    // ... flatten nested fields using get() with defaults
  };
  return result;
}
```

**2. Add to FhirDehydrator object (around line 6938+):**
```javascript
export const FhirDehydrator = {
  // ... other methods
  dehydrate{ResourceType}: flatten{ResourceType},  // <-- ADD THIS LINE
  // ... other methods
}
```

**3. Add to default export (around line 7030+):**
```javascript
export default {
  // ...
  flatten{ResourceType},  // <-- ADD THIS LINE
  // ...
}
```

**CRITICAL**: Table components call `FhirDehydrator.dehydrate{ResourceType}()`, not `flatten{ResourceType}()`:
```javascript
// In {ResourceTypes}Table.jsx
const flattened = FhirDehydrator.dehydrate{ResourceType}(record);
```

### Step 4.7: Settings

**CRITICAL**: Add to ALL THREE settings files:

1. `configs/settings.honeycomb.tdd.json` (for tests - THIS IS USED BY medical-home-autologin)
2. `configs/settings.honeycomb.localhost.json` (for local dev)
3. `configs/settings.honeycomb.dicom.localhost.json` (for dark mode)

```json
{
  "public": {
    "modules": {
      "fhir": {
        "{ResourceTypes}": true
      }
    }
  },
  "private": {
    "fhir": {
      "rest": {
        "{ResourceType}": {
          "interactions": ["read", "create", "update", "delete", "search"],
          "search": true,
          "publication": true
        }
      }
    }
  }
}
```

**If route doesn't load after adding settings**: Restart the Meteor server. Settings changes require a restart.

---

## PHASE 5: THEME AUDIT

Run theme audit on new components:
```
/audit-theme imports/ui-fhir/{resourceTypes}/
```

Fix any hardcoded colors found.

---

## PHASE 6: ITERATE UNTIL GREEN

### Step 6.1: Run Tests

```bash
npx nightwatch --config nightwatch.circle.conf.js \
  tests/nightwatch/honeycomb/enable_autopublish/crud.{resourceTypes}.js
```

### Step 6.2: Analyze Failures

For each failing test:
1. Read test output and error messages
2. Check browser console for JavaScript errors
3. Check Meteor server logs (`/tmp/meteor-server.log`)
4. Identify root cause

> **CRITICAL: Address ALL Browser Console Errors**
>
> When debugging, treat ANY browser console error as significant, even if it doesn't seem immediately related to the failing test. The baseline assumption is that the system is under quality control and errors have been removed. If an error appears:
>
> 1. **It is NEW** - Something we just changed caused it
> 2. **It MUST be addressed** before continuing
> 3. Schema validation errors and missing function errors are common causes of "page won't render" issues
>
> Common error patterns that block page rendering:
> - `flattenX is not a function` → Missing dehydrator function (use `dehydrateX`)
> - `Cannot read property 'X' of undefined` → Schema field mismatch or missing import
> - `Match error: Expected string` → SimpleSchema validation failure
> - `Uncaught TypeError` → Missing import or undefined variable
> - `Mongo.Collection` error → Collection not registered in all 3 places
>
> **DO NOT** ignore errors for multiple debug cycles hoping they'll resolve themselves. Fix them immediately.

**Debug JavaScript Errors (if page crashes):**
```javascript
browser.execute(function() {
  window.__capturedErrors = [];
  window.onerror = function(msg, url, line, col, error) {
    window.__capturedErrors.push({ msg, stack: error?.stack });
  };
});

browser.execute(function() {
  Meteor.navigate('/resource-page');
});

browser.pause(3000);

browser.execute(function() {
  return window.__capturedErrors;
}, [], function(result) {
  console.log('Errors:', JSON.stringify(result.value, null, 2));
});
```

### Step 6.3: Fix Issues

Common issues:
| Error | Fix |
|-------|-----|
| `flattenX is not a function` | Use `FhirDehydrator.dehydrateX()` not `flattenX()` |
| Page crashes (empty react-target) | Check browser console for JS errors - DON'T IGNORE THEM |
| `testUtils.login is not a function` | Use `loginHelper.ensureLoggedIn()` |
| Session lost after navigation | Use `testUtils.navigateUrl()` instead of `browser.url()` |
| Module not enabled | Add to TDD settings file (`configs/settings.honeycomb.tdd.json`), restart server |
| Port 3000/8080 in use | Run pre-flight cleanup commands |
| Element not found | Check selectors, add pauses |
| Subscription timeout | Increase pause after search to 3000ms+ |
| Form not submitting | Check React event dispatch |
| Delete intercepted | Use execute block for click |
| `Cannot read property 'X' of undefined` | Check browser console - likely missing import or schema mismatch |
| `Match error: Expected string` | SimpleSchema validation failure - check field types |
| Page blank but no test error | Check browser console for silent JS errors blocking render |

### Step 6.4: Repeat

Continue fixing and re-running until all 9 tests pass.

---

## PHASE 7: MANUAL REVIEW

### Step 7.1: Present Changes

Show user:
- Files created/modified
- Test results (all passing)
- Theme audit results
- ID lookup audit results

### Step 7.2: User Approval

Wait for user to approve before committing.

### Step 7.3: Update Manifest

Edit `FHIR_RESOURCES_MANIFEST.md`:
- Change status from `pending` to `done`
- Update Tests column: ❌ → ✅
- Update UI column: ❌ → ✅
- Add entry to Change Log

---

## PHASE 7.5: UPDATE CIRCLECI CONFIGURATION

### Step 7.5.1: Identify Test Group

Resource types map to CircleCI test groups:

| Resource Type | Test Group |
|---------------|------------|
| Patient, Practitioner, CareTeam | actors |
| Observation, Condition, Encounter, Procedure, BodyStructure, ClinicalImpression | clinical-history |
| AllergyIntolerance, Immunization | autoimmune |
| Medication, MedicationRequest, MedicationAdministration | pharmacy |
| DiagnosticReport, ImagingStudy | radiology |
| CarePlan, ServiceRequest, NutritionOrder, ActivityDefinition | care-management |
| Questionnaire, QuestionnaireResponse | structured-data-capture |
| ResearchStudy, ResearchSubject | clinical-trials |
| Consent, Task, PlanDefinition | administrative |
| Location, Device, SupplyDelivery | supply-chain |
| Communication, MessageHeader | communications |
| Measure, MeasureReport | public-health |
| DocumentReference, Media | library-sciences |

### Step 7.5.2: Update CircleCI Config

Edit `.circleci/config.yml` in **TWO places**:

**1. Parameters section** (JSON test-groups array ~line 10-136):
```json
{
  "name": "{test-group}",
  "tests": [
    "existing/test/file.js",
    "tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js"
  ]
}
```

**2. Workflows section** (~line 494-586):
```yaml
- test-group:
    name: {test-group}
    group-name: {test-group}
    test-files: "existing/test.js tests/nightwatch/honeycomb/enable_autopublish/crud.{resources}.js"
```

### Step 7.5.3: Verify Config

Read back the modified sections to confirm correct placement and YAML syntax.

---

## Completion Criteria

A resource is complete when:
- [ ] JSONSchema downloaded to `imports/lib/schemas/R4B/JsonSchema/{Resource}.json`
- [ ] All 9 CRUD tests pass
- [ ] UI pages functional (`/{resources}`, `/{resources}/new`, `/{resources}/:id`)
- [ ] `/audit-theme` clean
- [ ] `/audit-id-lookups` clean
- [ ] Manifest updated
- [ ] Test added to `.circleci/config.yml` in appropriate test group

---

## Error Recovery

### If Meteor crashes:
```bash
# Kill any stuck processes
pkill -f "meteor run" || true
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Restart with auto-login
meteor npm run medical-home-autologin > /tmp/meteor-server.log 2>&1 &

# Wait for ready
sleep 30
curl http://localhost:3000
```

### If tests timeout:
- Check if Meteor is running (`curl http://localhost:3000`)
- Check server logs (`tail -50 /tmp/meteor-server.log`)
- Increase test timeouts in nightwatch config
- Check for subscription limits

### If stuck in loop:
- User can interrupt with Ctrl+C
- Resume by running `/ralph-fhir-loop` again with same resource

### If route doesn't load (page crashes):
1. Check browser console for JavaScript errors
2. Common cause: `FhirDehydrator.flattenX is not a function` - use `dehydrateX` instead
3. Ensure all THREE places in FhirDehydrator.js are updated

---

## Reference

- **Manifest**: `FHIR_RESOURCES_MANIFEST.md`
- **JSONSchema source**: `https://hl7.org/fhir/R4B/{resource}.schema.json.html`
- **Test patterns**: `.claude/rules/testing/crud-patterns.md`
- **UI patterns**: `.claude/rules/fhir/resource-implementation.md`
- **typed:model**: https://forums.meteor.com/t/introducing-typed-model-zod-validated-type-safe-mongodb-collections-for-meteor/64258
