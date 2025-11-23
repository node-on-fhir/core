# CRUD Test Implementation Guide

This guide provides patterns and checklists for implementing CRUD tests in the Honeycomb application, based on lessons learned from implementing Conditions, CarePlans, and Encounters tests.

**Placeholder Conventions:**
- `{ResourceType}` - PascalCase singular (e.g., Condition, CarePlan)
- `{resourceType}` - camelCase singular (e.g., condition, carePlan)
- `{ResourceTypes}` - PascalCase plural (e.g., Conditions, CarePlans)
- `{resourceTypes}` - camelCase plural (e.g., conditions, carePlans)

## Core Testing Philosophy

1. **Don't modify tests that have been refined over nearly a decade** - The tests represent business requirements. Adjust the application code to meet the tests, not the other way around.
2. **Test Driven Development (TDD)** - The tests define the expected behavior. Implementation should satisfy these expectations.
3. **Handle both empty and populated databases** - Tests must work whether the database is empty or contains 2.6M+ records.
4. **Search before clicking in large datasets** - With 100+ records, always filter the table before finding and clicking rows.

## Quick Scan Checklist for Existing CRUD Tests

When updating an existing `crud.*.js` test file, scan for these common issues:

### 1. Navigation Pattern Issues
- [ ] Search for `browser.url('http://localhost:3000/` mid-test (after test 01)
- [ ] Replace with `testUtils.navigateUrl(browser, '/path')` to preserve Session
- [ ] Ensure `const testUtils = require('./shared-test-utils');` at top

### 2. Detail Component Data Loading
- [ ] Open corresponding `{ResourceType}Detail.jsx` component
- [ ] Check if data loading useEffect waits for `isSubscriptionReady`
- [ ] Replace with optimistic loading pattern (load immediately if data exists)
- [ ] Add fallback to try both `_id` and `id` fields

### 3. Patient Context Management
- [ ] Add `let testPatientId = null;` at suite level (after `const timestamp`)
- [ ] Store ID when patient created: `testPatientId = result.result;` (in both login paths)
- [ ] Use `patients.findOne` Meteor method to fetch patient (don't use client collection)
- [ ] In test 02, restore Session after `browser.url()` using stored `testPatientId`
- [ ] Verify mid-test navigation uses `testUtils.navigateUrl()` (preserves Session automatically)

**Why**: Subscription limits (100 records) mean newly created patients may not appear in client collection. Use server method to fetch from database.

### 4. Search-Based Row Finding (Critical for Large Datasets)
- [ ] Check if tests use search before finding/clicking rows in tables with 100+ records
- [ ] Add search filter before row clicking in tests 05-09
- [ ] Use short, unique search terms (e.g., "Smith" instead of full name with timestamp)
- [ ] Always verify table contains search term before clicking: `.assert.containsText('#table', searchTerm)`
- [ ] Allow 3+ seconds after `.setValue()` for character-by-character typing to complete

**Why**: With 100 records in table, finding specific test row without filtering is unreliable and slow.

### 5. React Form Input Handling
- [ ] Search for `clearValue()` + `setValue()` patterns on search inputs
- [ ] Replace with execute block that triggers React events (see section 6)
- [ ] Check for `.click('#...Select')` on Material-UI Select components
- [ ] Move click inside execute block to avoid "element click intercepted" errors

**Why**: `clearValue()` doesn't trigger React onChange events, causing value concatenation. Material-UI clicks outside execute blocks get intercepted by overlapping elements.

---

## Quick Fix Templates

### Test Structure (Suite Level)
```javascript
describe('Resource CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Store patient ID for cross-test access

  const testResource = { /* ... */ };
  // ...
});
```

### Test 01: Patient Creation with Server Fetch
```javascript
it('01. Setup test environment', browser => {
  // After testUtils.createTestPatient callback:
  testPatientId = result.result; // Store ID

  // Fetch patient from server and set in Session
  browser.executeAsync(function(patientId, done) {
    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('Set selected patient in Session:', patient._id, patient.name?.[0]?.text);
          done({ success: true, patientId: patient._id, patientName: patient.name?.[0]?.text });
        } else {
          console.error('Patient not found:', patientId);
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [result.result], function(fetchResult) {
    if (fetchResult.value.success) {
      console.log('Successfully set selected patient:', fetchResult.value);
    } else {
      console.error('Failed to set selected patient:', fetchResult.value.error);
    }
  });
});
```

### Test 02: Session Restoration After browser.url()
```javascript
it('02. Verify list page loads', browser => {
  browser
    .url('http://localhost:3000/{resourceTypes}')
    .waitForElementVisible('#{resourceTypes}Page', 5000);

  // Re-establish patient context (browser.url clears Session)
  browser.executeAsync(function(patientId, done) {
    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('Re-established patient context:', patient._id, patient.name?.[0]?.text);
          done({ success: true });
        } else {
          console.error('Patient not found:', patientId);
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [testPatientId]);

  browser.pause(500); // Let subscription update
});
```

### Mid-Test Navigation (Tests 03+)
```javascript
// Instead of:
- browser.url('http://localhost:3000/{resourceTypes}')

// Use:
+ testUtils.navigateUrl(browser, '/{resourceTypes}');
  browser.waitForElementVisible('#{resourceTypes}Page', 5000);
```

### Detail Component Data Loading
```javascript
// In {ResourceType}Detail.jsx - replace subscription-dependent loading
useEffect(function() {
  if (id && id !== 'new') {
    // Load immediately if data exists - don't wait for subscription
    const existing = {ResourceTypes}.findOne({_id: id});

    if (existing) {
      set{ResourceType}(existing);
      setIsEditing(false);
    } else {
      // Fallback: try id field
      const byId = {ResourceTypes}.findOne({id: id});
      if (byId) {
        set{ResourceType}(byId);
        setIsEditing(false);
      }
    }
  }
}, [id]); // Only depend on id, not subscription status
```

## Key Patterns and Issues Discovered

### 1. MongoDB ObjectID vs String ID Handling
- **Issue**: Synthea data creates MongoDB ObjectIDs, while Meteor creates string IDs
- **Solution**: Handle both gracefully without modifying tests
  ```javascript
  // In UI components, normalize ObjectIDs
  const idString = typeof id === 'object' && id._str ? id._str : String(id);
  ```

#### Dynamic ID Generation Pattern
To ensure consistent sorting with existing Synthea data, we implemented a flexible ID generation strategy:

**Server-side (methods.js):**
```javascript
// Set _id based on environment variable
if (process.env.USE_MONGO_OBJECTID) {
  // Use MongoDB ObjectID for consistency with existing data
  const { Mongo } = Package.mongo;
  const objectId = new Mongo.ObjectID();
  // Convert to hex string for Meteor
  cleanPatient._id = objectId.toHexString();
  console.log('[patients.insert] Using MongoDB ObjectID (as hex string):', cleanPatient._id);
} else {
  // Default: Set _id to match id (Meteor string ID)
  cleanPatient._id = cleanPatient.id;
  console.log('[patients.insert] Using Meteor string ID:', cleanPatient._id);
}
```

**Why This Matters:**
- Synthea-generated patients use MongoDB ObjectIDs (24-character hex strings)
- New patients created via UI typically use Meteor string IDs (17-character random strings)
- MongoDB ObjectIDs sort differently than string IDs
- The USE_MONGO_OBJECTID environment variable allows consistent ID generation
- This ensures new test patients appear in predictable positions in sorted lists
- **Testing Impact**: Don't rely on specific positions in lists - use search instead

### 2. Patient Selection and Multi-Patient Data Scoping
- **Context**: The application operates in a multi-user, multi-patient environment where data must be scoped to the selected patient
- **Key Concepts**:
  - Each user has an account (e.g., 'janedoe' test user)
  - Users select a patient context via `Session.set('selectedPatient', patient)`
  - Publications and subscriptions filter data based on the selected patient
  - FHIR resources reference patients by FHIR `id`, not MongoDB `_id`

- **Implementation Pattern**:
  ```javascript
  // In the UI component's data tracker
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  
  // FHIR resources use the patient's FHIR id, not MongoDB _id
  const fhirId = get(selectedPatient, 'id');
  if(fhirId) {
    query = FhirUtilities.addPatientFilterToQuery(fhirId);
  } else if(selectedPatientId) {
    query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
  }
  
  // The subscription uses this query to filter data
  if(autoPublishEnabled){
    const handle = Meteor.subscribe('autopublish.Conditions', query, { limit: 1000 });
  }
  ```

- **Why This Matters**: 
  - Without proper patient selection, the list will be empty (no conditions shown)
  - The subscription filters server-side data to only return records for the selected patient
  - This ensures users only see data for their currently selected patient context

### 3. Auto-populated Fields
- **Issue**: Some fields (like asserter/author) are automatically set to the logged-in user
- **Solution**: Document this behavior and adjust test expectations accordingly
  ```javascript
  // IMPORTANT: The component automatically sets the author to the current
  // logged-in user when creating a new record. This is expected behavior.
  const expectedAuthor = 'janedoe'; // our test user
  ```

### 4. Data Transformation Issues
- **Issue**: Data may need transformation between FHIR R4 format and SimpleSchema format
- **Solution**: Ensure transformation functions preserve all fields, especially CodeableConcepts
  ```javascript
  // Preserve the code field (SNOMED code)
  if (conditionData.code) {
    transformed.code = conditionData.code;
  }
  ```

### 5. Sort Order and Table Display
- **Issue**: Newly created records may appear at the bottom of tables
- **Solution**: Ensure consistent sorting
  ```javascript
  // Sort by _id descending to get newest first
  const results = Conditions.find(query, { sort: { _id: -1 } }).fetch();
  ```

### 6. React Form Input Handling
- **Issue**: Setting values programmatically in React forms requires special handling
- **Solution**: Use different approaches for different input types

#### The clearValue() Problem

**Critical Discovery**: Nightwatch's `clearValue()` does NOT reliably clear React-controlled inputs.

**Why it fails**:
- `clearValue()` clears the DOM value but doesn't trigger React's `onChange` events
- React's state still thinks the old value is there
- When `setValue()` types new characters, React concatenates them instead of replacing
- This is a well-known issue with React-controlled inputs in automated testing

**Symptom**: Search values concatenating like `"Patient photo 1763897715996Patient photo"`

#### Search Input Pattern (Execute Block - REQUIRED)

For search inputs and any fields where `clearValue()` fails, use this pattern:

```javascript
// CORRECT - Execute block that properly triggers React events
browser
  .waitForElementVisible('#searchInput', 5000)
  .execute(function(searchValue) {
    const input = document.querySelector('#searchInput');
    if (input) {
      // Clear the field
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // Set new value
      input.value = searchValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, [searchValue])
  .pause(1000);
```

**What this does**:
1. Explicitly clears React's state: `input.value = ''` + `dispatchEvent('input')` tells React the field is now empty
2. Properly sets new value: `input.value = searchValue` + `dispatchEvent('input')` tells React the new value
3. Triggers all necessary events: Both `input` and `change` events ensure React state updates
4. No more concatenation: React sees clear → empty → new value, not old value → concatenated value

#### Regular Text Input Pattern (Use setValue directly)

For regular text inputs that will be fully replaced (not search fields):

```javascript
// CORRECT for non-search text inputs
browser
  .clearValue('#codeInput')
  .setValue('#codeInput', testData.codeCode)
  .clearValue('#notesTextarea')
  .setValue('#notesTextarea', testData.notes);
```

**Important**: Use the correct field values from test data (e.g., codeCode for the code field, codeDisplay for the display field)

#### Material-UI Select Pattern (Execute Block - REQUIRED)

For Material-UI Select components, you MUST use execute blocks with the click inside:

```javascript
// CORRECT - Click and select inside execute block
browser
  .execute(function(value) {
    const statusSelect = document.querySelector('#statusSelect');
    if (statusSelect) {
      statusSelect.click();  // Click INSIDE execute to avoid interception
      setTimeout(() => {
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          const dataValue = item.getAttribute('data-value');
          const textValue = item.textContent.toLowerCase().replace(/\s+/g, '-');
          const searchValue = value.toLowerCase();

          if (dataValue === value || textValue === searchValue) {
            item.click();
            break;
          }
        }
      }, 300);  // Wait for dropdown to render
    }
  }, [statusValue])
  .pause(500);
```

**Why this is required**:
- Material-UI Select components have overlapping elements
- Nightwatch's `.click('#statusSelect')` outside execute blocks gets intercepted
- Error: "element click intercepted: Element ... is not clickable at point (x, y). Other element would receive the click"
- Clicking inside JavaScript execute block bypasses Selenium's element position checking

```javascript
// WRONG - Will fail with "element click intercepted"
browser
  .click('#statusSelect')  // ✗ Gets intercepted
  .pause(1000)
  .execute(function(value) {
    // ... select menu item
  }, [value]);
```

#### When to Use Each Pattern

| Input Type | Pattern | Reason |
|------------|---------|--------|
| Search inputs | Execute block (clear + set + events) | `clearValue()` doesn't trigger React events |
| Regular text inputs | `clearValue()` + `setValue()` | Simple replacement works |
| Material-UI Select | Execute block (click + select) | Avoid element interception errors |
| Date inputs | `clearValue()` + `setValue()` | Simple replacement works |
| Textareas | `clearValue()` + `setValue()` | Simple replacement works |

#### Why Native Setter Approach Fails

```javascript
// WRONG - This causes "Illegal invocation" errors
browser.execute(function(value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  nativeInputValueSetter.call(field, value); // Causes "Illegal invocation"
});
```

The native setter approach causes "Illegal invocation" errors in the browser and should be avoided for standard form inputs.

## Navigation Pattern: Preserving Session State

### Critical Discovery: `browser.url()` vs `Meteor.navigate()`

**Problem**: Using `browser.url()` mid-test causes full page reload, which **clears all Meteor Session variables**. This loses critical test context like `selectedPatient` and `selectedPatientId`.

**Solution**: Use `testUtils.navigateUrl()` helper for mid-test navigation.

### The `navigateUrl()` Helper

Located in `shared-test-utils.js`:

```javascript
const testUtils = require('./shared-test-utils');

// Instead of browser.url() (which clears Session):
testUtils.navigateUrl(browser, '/allergy-intolerances');
browser.waitForElementVisible('#allergyIntolerancesPage', 5000);
```

**How it works:**
1. Uses `Meteor.navigate()` under the hood (React Router client-side navigation)
2. Falls back to `window.location.href` if `Meteor.navigate()` not available
3. Preserves all Session variables
4. Logs navigation method for debugging

### When to Use Each Approach

#### Use `browser.url()` for:
- **Initial navigation** at test suite start
- **First page load** (no Session to preserve)
- **External URLs**

```javascript
before(browser => {
  browser
    .windowSize('current', 1400, 900)
    .url('http://localhost:3000')  // Initial load - OK
    .waitForElementVisible('body', 5000);
});
```

#### Use `testUtils.navigateUrl()` for:
- **Mid-test navigation** between pages
- **Returning to list** after detail view
- **Any navigation where Session must be preserved**

```javascript
it('06. View details', browser => {
  // View details...

  // Navigate back - MUST preserve Session!
  testUtils.navigateUrl(browser, '/allergy-intolerances');
  browser.waitForElementVisible('#allergyIntolerancesPage', 5000);
  // Patient context still available ✓
});
```

### Migration Pattern

**Before (Session lost ✗):**
```javascript
it('07. Update record', browser => {
  browser
    .url('http://localhost:3000/allergy-intolerances')  // ✗ Clears Session!
    .waitForElementVisible('#allergyIntolerancesTable', 5000);

  // Have to re-establish patient context...
  browser.execute(function() {
    const patient = Patients.findOne({...});
    Session.set('selectedPatient', patient);
  });
});
```

**After (Session preserved ✓):**
```javascript
const testUtils = require('./shared-test-utils');

it('07. Update record', browser => {
  testUtils.navigateUrl(browser, '/allergy-intolerances');  // ✓ Preserves Session!
  browser.waitForElementVisible('#allergyIntolerancesTable', 5000);
  // Patient context automatically available - no re-establishment needed ✓
});
```

### Why This Matters

Without `navigateUrl()`:
- ✗ Tests must re-establish patient context after every navigation
- ✗ Tables appear empty because no patient is selected
- ✗ Slower (full page reload vs client-side navigation)
- ✗ Doesn't match real user behavior

With `navigateUrl()`:
- ✓ Session preserved automatically
- ✓ Patient context maintained throughout test
- ✓ Faster tests
- ✓ Mimics actual user navigation

### Implementation in NavigationProvider

The `Meteor.navigate()` function is exposed via `NavigationContext.jsx`:

```javascript
// imports/ui/NavigationContext.jsx
useLayoutEffect(function() {
  if (typeof Meteor !== 'undefined') {
    Meteor.navigate = function(path, options) {
      navigate(path, options);  // React Router's navigate
    };

    return function() {
      delete Meteor.navigate;
    };
  }
}, [navigate]);
```

This makes React Router's client-side navigation available globally for tests.

## Detail Component Data Loading Pattern

**Problem**: Waiting for `isSubscriptionReady` can block data loading even when data exists.

**Solution**: Load data immediately if it exists, regardless of subscription status.

```javascript
// In AllergyIntoleranceDetail.jsx (or similar detail components)
useEffect(() => {
  if (id && id !== 'new') {
    // Load immediately if data exists - don't wait for subscription
    const existingAllergy = AllergyIntolerances.findOne({_id: id});

    if (existingAllergy) {
      setAllergyIntolerance(existingAllergy);
      setIsEditing(false);
    } else {
      // Fallback: try finding by id field
      const allergyById = AllergyIntolerances.findOne({id: id});
      if (allergyById) {
        setAllergyIntolerance(allergyById);
        setIsEditing(false);
      }
    }
  }
}, [id]); // Only depend on id, not subscription status
```

**Why**: Subscription status may never report "ready" even when data is available in the collection. Load optimistically.

## Patient Context and Data Scoping in Tests

### Understanding the Data Flow
1. **User Login**: Test user 'janedoe' logs in
2. **Patient Creation**: Test creates a patient record
3. **Patient Selection**: Patient is set in Session variables:
   ```javascript
   Session.set('selectedPatientId', patient._id);
   Session.set('selectedPatient', patient);
   ```
4. **Navigation**: When navigating to a resource list (e.g., /conditions):
   - The page component reads the selected patient from Session
   - It builds a query using the patient's FHIR id
   - The subscription filters data to only that patient's records
5. **Resource Creation**: When creating a new resource:
   - The patient reference is automatically set from Session
   - The resource is linked to the selected patient

### Common Patient Context Issues
- **Empty List**: If no patient is selected, the list will be empty even if records exist
- **Wrong Patient**: If Session isn't set correctly, you may see another patient's data
- **ID Mismatch**: Using MongoDB _id instead of FHIR id in references
- **Subscription Filtering**: The autopublish subscription filters on the server - if the query doesn't match how data is stored, nothing returns
- **Reference Format**: FHIR resources store patient references as `Patient/[id]`, not just the ID

### Testing Strategy for Patient Context
```javascript
// In test setup, always:
// 1. Create a test patient
testUtils.createTestPatient(browser, {...}, function(result) {
  // 2. Set the patient in Session immediately
  browser.execute(function(patientId) {
    const patient = Patients.findOne({_id: patientId});
    Session.set('selectedPatientId', patientId);
    Session.set('selectedPatient', patient);
  }, [result.result]);
});

// 3. When debugging empty lists, check:
browser.execute(function() {
  console.log('Selected patient:', Session.get('selectedPatient'));
  console.log('Selected patient ID:', Session.get('selectedPatientId'));
  console.log('Total conditions:', Conditions.find().count());
  console.log('Filtered conditions:', Conditions.find(query).count());
});
```

### Publication and Subscription Example

**Server-side Publication (autopublish.js):**
```javascript
Meteor.publish('autopublish.{ResourceTypes}', function(query, options) {
  // Default empty query and options
  query = query || {};
  options = options || {};
  
  // Cap at 100-1000 records for performance
  options.limit = options.limit || 100;
  if (options.limit > 1000) {
    options.limit = 1000;
  }
  
  // Default sort by most recent first
  if (!options.sort) {
    options.sort = { '_id': -1 };
  }
  
  console.log(`Publishing {ResourceTypes} with query:`, JSON.stringify(query), 'options:', options);
  
  // Return the cursor - Meteor handles the reactive updates
  return {ResourceTypes}.find(query, options);
});
```

**Client-side Subscription ({ResourceTypes}Page.jsx):**
```javascript
const isLoading = useTracker(() => {
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  
  // Build patient filter query using FhirUtilities
  let query = {};
  if(selectedPatient || selectedPatientId) {
    const fhirId = get(selectedPatient, 'id');
    if(fhirId) {
      query = FhirUtilities.addPatientFilterToQuery(fhirId);
    } else if(selectedPatientId) {
      query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
    }
  }
  
  // Subscribe with the filtered query
  const handle = Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 1000 });
  return !handle.ready();
}, [Session.get('selectedPatientId')]);
```

**What FhirUtilities.addPatientFilterToQuery creates:**
```javascript
// For a given patientId, it returns a query like:
{
  $or: [
    {"patient.reference": "Patient/" + patientId},
    {"patient.reference": "urn:uuid:" + patientId},
    {"subject.reference": "Patient/" + patientId},
    {"subject.reference": "urn:uuid:" + patientId},
    {"patient.reference": { $regex: ".*Patient/" + patientId}}, 
    {"subject.reference": { $regex: ".*Patient/" + patientId}}
  ]
}
```

This comprehensive query handles various ways FHIR resources might reference a patient, ensuring we catch all records for the selected patient.

### Patient Context Management in Multi-Test Suites (CRITICAL FOR CI)

**The Problem:**

In test suites where test 01 creates a patient and tests 07-09 need to use it, the patient may not be findable in later tests when running in CI with subscription limits:

1. **Subscription Limits**: Autopublish limits to 100-1000 records for performance
2. **Database Has Existing Data**: Synthea generates 100+ patients already in DB
3. **New Patient Outside Window**: Test patient exists in DB but isn't in the subscribed 100 records
4. **Client Query Fails**: `Patients.findOne()` only searches subscribed records, returns `null`
5. **Session Not Set**: Without patient in Session, filtered queries return empty
6. **Heisenbug**: Works locally (small DB) but fails intermittently in CI (large DB)

**The Solution Pattern:**

**1. Store Patient ID at Suite Level:**
```javascript
describe('Communications CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Accessible across all tests in suite

  const testCommunication = { /* ... */ };
```

**2. Capture ID in Test 01:**
```javascript
it('01. Setup test environment', browser => {
  testUtils.createTestPatient(browser, {
    name: 'John Doe',
    family: 'Doe',
    given: 'John',
    identifier: 'test-patient-' + timestamp
  }, function(result) {
    testPatientId = result.result; // ← Store for later tests
    console.log('Created patient with ID:', testPatientId);

    // Then fetch from server and set in Session
    browser.executeAsync(function(patientId, done) {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          done({ success: true });
        }
      });
    }, [testPatientId]);
  });
});
```

**3. Re-establish Context in Later Tests Using Server Method:**
```javascript
it('07. Update existing communication', browser => {
  // DON'T use client collection lookup - subscription limits!
  // ✗ BAD: const patient = Patients.findOne({'identifier.value': ...});

  // ✓ GOOD: Use server-side Meteor method
  browser.executeAsync(function(patientId, done) {
    console.log('[Test 07] Re-establishing patient context with ID:', patientId);

    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      // Server method queries DB directly, bypasses subscription limits
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('[Test 07] Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('[Test 07] Re-established patient context:', patient._id);
          done({ success: true, patientId: patient._id });
        } else {
          console.error('[Test 07] Patient not found:', patientId);
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [testPatientId], function(result) {
    if (result.value && result.value.success) {
      console.log('[Test 07] Successfully re-established patient context');
    } else {
      console.error('[Test 07] Failed to re-establish patient context:', result.value?.error);
    }
  });

  browser.pause(1000); // Let subscription react to new Session value
});
```

**Why This Works:**

- **Server Method**: `Meteor.call('patients.findOne', id)` queries MongoDB directly
- **Not Limited by Subscriptions**: Can find any patient in DB regardless of client collection state
- **Guaranteed Success**: Using exact `_id` we captured, not searching by identifier
- **Works in Both Environments**: Local (small DB) and CI (large DB with limits)

**When to Apply This Pattern:**

✅ **Required When:**
- Test suite has multiple tests (01 creates, 07+ uses)
- Database has 100+ existing records
- Running in CI with unpredictable environment
- Seeing intermittent "empty table" or "patient not found" failures

❌ **Not Needed When:**
- Single test creates and uses data (no cross-test dependencies)
- Small datasets (< 50 records total)
- Test creates patient and uses it in same test (data guaranteed in subscription)

**Examples of This Pattern:**
- ✅ `crud.immunizations.js` (lines 8, 69, 674-701)
- ✅ `crud.observations.js` (lines 9, 68, 624-651)
- ✅ `crud.allergyintolerances.js` (lines 8, 67, 624-651)
- ✅ `crud.careplans.js` (lines 8, 67, 624-651)

**Related Best Practice:** Always use `testUtils.navigateUrl()` instead of `browser.url()` for mid-test navigation to preserve Session state.

## Implementation Checklist for New CRUD Tests

### 1. Test Structure Setup
- [ ] Import shared test utilities: `const testUtils = require('./shared-test-utils');`
- [ ] Create timestamp for uniqueness: `const timestamp = Date.now();`
- [ ] Define test data objects with timestamp-based unique values
- [ ] Document any auto-populated fields that will differ from test data
- [ ] Set appropriate window size for table visibility: `.windowSize('current', 1400, 900)`

### 2. Environment Setup (Test 01)
- [ ] Check and handle login state (autologin or manual)
- [ ] Create test user if needed (`test.createTestUser`)
- [ ] Create test patient using `testUtils.createTestPatient`
- [ ] Set patient in Session immediately after creation
- [ ] Clean up existing test data to ensure clean state
- [ ] Add testing strategy documentation explaining the approach

### 3. List Page Verification (Test 02)
- [ ] Navigate to the resource list page
- [ ] Check for either table or no-data state
- [ ] Verify page elements are visible
- [ ] Handle both empty and populated database scenarios

### 4. Navigation to Create Form (Test 03)
- [ ] Click "Add [Resource]" button
- [ ] Wait for detail page to be visible
- [ ] Verify all form fields are present
- [ ] Check initial field values (e.g., auto-populated asserter/author)
- [ ] Document any fields that are automatically set

### 5. Create New Resource (Test 04)
- [ ] Fill form fields using Nightwatch's `.setValue()` for reliability
- [ ] Use execute block as fallback for complex inputs
- [ ] Handle Material-UI Select components specially
- [ ] Log form values before save for debugging
- [ ] Click Save button and verify navigation back to list

### 6. Verify Creation (Test 05)
- [ ] Check that new resource appears in list
- [ ] Handle both table and potential no-data states
- [ ] Don't assume specific position in list without proper sorting

### 7. View Resource Details (Test 06)
- [ ] Click on the newly created resource (use first row if sorted newest-first)
- [ ] Verify all field values match what was saved
- [ ] Check that auto-populated fields have expected values
- [ ] Handle fields that may have been transformed during save

### 8. Edit Resource (Test 07)
- [ ] Enter edit mode (click lock/edit button)
- [ ] Update multiple fields
- [ ] Save changes
- [ ] Verify updates were saved correctly

### 9. Delete Resource (Test 08)
- [ ] Navigate to resource detail
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify resource is removed from list

### 10. Teardown (Test 09)
- [ ] Clean up any remaining test data
- [ ] Log out if needed
- [ ] Reset any Session variables

## Quality Control Checklist

### For Existing Tests
- [ ] **DO NOT modify test expectations without user approval**
- [ ] Check if test handles both empty and populated databases
- [ ] Verify test doesn't rely on specific data ordering without explicit sort
- [ ] Ensure test handles auto-populated fields correctly
- [ ] Check for proper handling of MongoDB ObjectIDs vs String IDs
- [ ] Verify patient selection/reference handling matches FHIR standards
- [ ] Ensure form value setting works with React components
- [ ] Check that timestamps or unique identifiers prevent test data conflicts

### For Application Code
- [ ] Data transformation functions preserve all fields
- [ ] Sort order is consistent and predictable
- [ ] UI components handle both ObjectID and String ID formats
- [ ] Patient filtering uses FHIR id appropriately
- [ ] Auto-populated fields are documented
- [ ] Form inputs work with both user interaction and programmatic setting

## Common Pitfalls to Avoid

1. **Don't use `browser.url()` for mid-test navigation** - use `testUtils.navigateUrl()` to preserve Session
2. **Don't search by identifier when you can use _id directly**
3. **Don't assume _id === id** (especially with Synthea data)
4. **Don't modify well-established test patterns**
5. **Don't forget to handle the no-data state**
6. **Don't assume specific sort order without explicitly setting it**
7. **Don't expect manually set values for auto-populated fields**
8. **Don't use complex search patterns when simple ones suffice**
9. **Don't filter data client-side when you can pass queries to subscriptions**
10. **Don't assume new records will appear at top/bottom without proper sorting**
11. **Don't test Material-UI Select components with simple selectors - use execute blocks**
12. **Don't try to find rows in large tables without search filtering first** - causes flaky tests
13. **Don't use `_id || id` fallback in onClick handlers** - use only `_id` like working components

## Debugging Tips

1. **Add console logging at key points**:
   - After patient creation
   - Before form submission
   - In click handlers
   - When searching for elements

2. **Check server logs for**:
   - Method calls (create, update, delete)
   - Data transformation steps
   - What's actually saved vs. what was sent

3. **Use browser execute blocks to**:
   - Check Session variables
   - Verify collection contents
   - Debug why elements aren't found

4. **Common issues and solutions**:
   - Empty SNOMED/code fields → Check data transformation preserves all fields
   - Wrong record clicked → Verify sort order and selection logic
   - Patient not set → Ensure Session variables are set after patient creation
   - Form values not saving → Use proper React input simulation
   - "Conditions exist but are filtered out" → Check patient context and subscription query
   - Empty patient reference in saved data → Verify Session patient is set before save

5. **Key Debugging Messages to Watch For**:
   ```
   // In browser console:
   "No patients found in collection" → Patient creation or timing issue
   "Conditions exist (100) but are filtered out" → Patient filter mismatch
   
   // In server logs:
   "Publishing Conditions with query: {}" → No patient filter applied
   "subject": { "reference": "", "display": "" } → Patient not set when saving
   ```

## Example Test Pattern

```javascript
// Simplified pattern showing key elements
describe('Resource CRUD Operations', function() {
  const timestamp = Date.now();
  const testResource = {
    // Define test data with timestamp for uniqueness
    name: `Test Resource ${timestamp}`,
    // Document auto-populated fields
    author: 'Will be set to logged-in user (janedoe)'
  };

  it('01. Setup test environment', browser => {
    // Handle login
    // Create test patient
    // Set patient in Session
    // Clean up old test data
  });

  it('02. Verify list page loads', browser => {
    // Navigate to list
    // Check for table or no-data state
  });

  it('03. Navigate to create form', browser => {
    // Click Add button
    // Verify form fields
  });

  it('04. Create new resource', browser => {
    // Fill form (use setValue)
    // Save
    // Verify navigation
  });

  it('05. Verify creation', browser => {
    // Check resource appears in list
  });

  it('06. View details', browser => {
    // Click first row (newest)
    // Verify field values
  });

  // ... continue with edit, delete, cleanup
});
```

This guide represents patterns refined through implementing and debugging CRUD tests. Follow these patterns for consistent, maintainable test implementations.

## Search-Based Test Pattern

To reliably find specific test data in large datasets (100+ records), tests now use the search functionality:

### Implementation
```javascript
// Add ID to search field
<TextField
  id="patientSearchInput"
  fullWidth
  placeholder="Search patients by ID, name, identifier..."
  // ...
/>

// In tests, search for specific patient
browser
  .waitForElementVisible('#patientSearchInput', 5000)
  .clearValue('#patientSearchInput')
  .setValue('#patientSearchInput', testPatient.givenName)
  .pause(1000); // Wait for search results to update
```

### Benefits
- Filters list to show only matching patients
- Avoids complex row-finding logic
- Works regardless of sort order
- Faster and more reliable than scanning all rows

## TEST_RUN Environment Variable Pattern

For operations that should only be available during testing:

### Server-side Protection
```javascript
// In methods.js
if (!process.env.TEST_RUN && !get(Meteor, 'settings.public.defaults.allowPatientDeletion', false)) {
  console.log('[patients.remove] Deletion blocked - not in TEST_RUN mode');
  throw new Meteor.Error('not-allowed', 'Patient deletion is restricted in production mode');
}
```

### Test-side Usage
```javascript
// Programmatic deletion in tests
browser.executeAsync(function(patientId, done) {
  Meteor.call('patients.remove', patientId, function(error, result) {
    if (error) {
      console.warn('Deletion failed:', error.message);
      // Don't fail test - method might require TEST_RUN env var
      done({ deleted: false, error: error.message });
    } else {
      done({ deleted: true });
    }
  });
});
```

### Running Tests with Environment Variables
```bash
# Start Meteor with TEST_RUN enabled
TEST_RUN=true meteor run --settings configs/settings.honeycomb.localhost.json

# Or set in your test runner
export TEST_RUN=true
npm test -- tests/nightwatch/honeycomb/enable_autopublish/crud.patients.js
```

This pattern allows:
- Safe testing of destructive operations
- Production protection by default
- Clear separation of test vs production behavior
- Flexibility for different deployment environments

## Large Dataset Testing Patterns

### Search-First Approach
When dealing with datasets containing 100+ records (common with Synthea data):

1. **Always implement search functionality first**
   ```javascript
   // Add search input with specific ID
   <TextField
     id="{resourceType}SearchInput"
     fullWidth
     placeholder="Search by ID, name, ..."
     value={searchFilter}
     onChange={(e) => setSearchFilter(e.target.value)}
   />
   ```

2. **Pass search query to subscription**
   ```javascript
   const isLoading = useTracker(() => {
     let query = {};
     if(searchFilter) {
       query = { /* search criteria */ };
     }
     const handle = Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 100 });
     return !handle.ready();
   }, [searchFilter]);
   ```

3. **Use search in tests to find specific records**
   ```javascript
   browser
     .setValue('#{resourceType}SearchInput', testResource.uniqueValue)
     .pause(1000) // Wait for search to filter
     .click('#{resourceTypes}Table tbody tr:first-child'); // Click filtered result
   ```

### Material-UI Component Testing

**Select Components:**
- Use execute blocks with setTimeout for portal-rendered options
- Search for options globally with `document.querySelectorAll('li[role="option"]')`
- Match by data-value attribute or text content

**Form State Management:**
- Check if form starts in edit mode for new resources
- Some forms may need explicit "Edit" button click
- Verify field enable/disable states match expected behavior

### Navigation and State Management

**Post-Save Navigation:**
- Successful save should navigate from `/new` to list page
- Staying on `/new` indicates save failure
- Check console errors and user authentication state

**Element Visibility and Scrolling:**
- After navigation, the page may be scrolled to an unexpected position
- Elements must be in the viewport to be interacted with
- Use `window.scrollTo(0, 0)` to ensure header elements are visible

```javascript
// Ensure search input is visible after navigation
browser.execute(function() {
  window.scrollTo(0, 0);
});
browser.pause(500);

// Now the search input should be accessible
browser
  .waitForElementVisible('#searchInput', 5000)
  .setValue('#searchInput', 'search term');
```

**Why This Matters:**
- After saving a record, the page often returns to the list view scrolled down
- Search bars and headers are typically at the top of the page
- Nightwatch cannot interact with elements outside the viewport
- `waitForElementVisible` checks DOM visibility, not viewport visibility

**Patient Context Preservation:**
- Always verify Session patient is set before operations
- Re-establish patient context after navigation if needed
- Debug with console logs showing Session state

### Debugging Large Datasets

```javascript
// Debug why data might be filtered out
browser.execute(function() {
  const total = {ResourceTypes}.find({}).count();
  const filtered = {ResourceTypes}.find(query).count();
  console.log(`Total: ${total}, Filtered: ${filtered}`);
  
  if (total > 0 && filtered === 0) {
    console.log('Data exists but is filtered out');
    console.log('Sample record:', {ResourceTypes}.findOne());
    console.log('Current query:', query);
  }
});
```

## Best Practices for Delete Operations

Based on extensive debugging of delete button issues, these patterns have proven most reliable:

### 1. Delete Button Execution Pattern

**DON'T use execute with callbacks - they can return null unexpectedly:**
```javascript
// AVOID THIS - callbacks can cause null return issues
browser.execute(function() {
  // ... find and click button
  return true;
}, [], function(result) {
  browser.assert.equal(result.value, true, 'Clicked button');
});
```

**DO use simple execute without callback:**
```javascript
// PREFERRED - simpler and more reliable
browser
  .execute(function() {
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Delete')) {
        button.click();
        return true;
      }
    }
    return false;
  })
  .pause(500)      // Wait for alert
  .acceptAlert()   // Handle confirmation
  .pause(1000);    // Wait for deletion
```

### 2. Button Detection Best Practices

- Use `includes()` rather than exact match for more flexibility
- Don't over-engineer the detection logic
- Simple text matching usually suffices
- If button text is known from debug output, trust it

### 3. Debugging Execute Function Issues

When execute returns `null` instead of expected boolean:
1. It's an execution problem, not a logic problem
2. Remove callbacks and try simpler approach
3. Check if component has different button visibility rules (edit vs view mode)
4. Look at working tests for proven patterns

### 4. Component-Specific Considerations

Different components may show Delete button in different modes:
- Some show Delete only in view mode (e.g., ImmunizationDetail)
- Others show Delete only in edit mode (e.g., some older components)
- Always check the actual component's button rendering logic

### 5. Key Learning: Simpler is Better

The most frustrating bugs often aren't in the logic but in framework usage:
- Complex detection logic wasn't the issue
- The callback pattern was the problem
- When something obvious should work but doesn't, question the execution mechanism

### Example Working Pattern

```javascript
it('09. Delete resource', browser => {
  browser
    .waitForElementVisible('#resourceDetailPage', 5000)
    .pause(500)
    // Simple execute without callback
    .execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Delete')) {
          window.__deleteButtonFound = true; // Optional debug flag
          button.click();
          return true;
        }
      }
      return false;
    })
    .pause(500)      // Wait for confirmation dialog
    .acceptAlert()   // Accept the confirmation
    .pause(1000);    // Wait for deletion to complete

  // Verify navigation back to list
  browser
    .waitForElementVisible('#resourceListPage', 5000)
    .execute(function() {
      // Verify either table or no-data state exists
      const hasTable = document.querySelector('#resourceTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null;
      return { hasTable, hasNoData };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasTable || result.value.hasNoData, 
        'Either table or no-data state present after deletion'
      );
    });
});
```

### Summary

When dealing with delete operations in Nightwatch tests:
1. Use execute without callbacks for clicking buttons
2. Keep the logic simple - don't overthink it
3. Trust debug output about button existence
4. Check component's actual button visibility rules
5. Look at working tests for proven patterns
6. Remember: `null` return usually means execution issue, not logic issue

## Search-Based Test Pattern for Large Datasets (Critical)

When working with tables that contain 100+ records (common with Synthea data), finding specific test records requires search filtering.

### The Problem

Without search:
- Table shows 100 records (subscription limit)
- Test tries to find specific row by scanning all 100
- Slow, unreliable, causes race conditions
- Often fails because test record isn't visible without filtering

### The Solution

Always use search before clicking rows in large datasets:

```javascript
it('06. View resource details', browser => {
  // Search for the specific test record first
  browser
    .clearValue('#resourceSearchInput')
    .pause(1000) // Wait for table to reset
    .setValue('#resourceSearchInput', 'Smith') // Short, unique search term
    .pause(3000) // Wait for character-by-character typing to complete
    .assert.containsText('#resourceTable', 'Smith'); // Verify filtered results

  // NOW click the row - should be only 1-2 rows visible
  browser.execute(function() {
    const rows = document.querySelectorAll('#resourceTable tbody tr');
    if (rows.length > 0) {
      rows[0].click(); // Click first row in filtered results
      return true;
    }
    return false;
  });
});
```

### Key Principles

1. **Search with short, unique terms**: "Smith" instead of "Dr. Smith 1763112187769"
   - Shorter = types faster
   - Less prone to timing issues

2. **Always verify before clicking**: Use `.assert.containsText()` to ensure table is filtered
   - Acts as implicit wait for search to complete
   - Fails fast if search doesn't work

3. **Allow sufficient time**: 3+ seconds after `.setValue()` for typing to complete
   - `.setValue()` types character-by-character
   - Each character triggers onChange in React
   - Multiple subscription queries fire sequentially

4. **Reuse search state when possible**: If previous test already has correct filter active
   ```javascript
   // Test 05 searches for "Smith"
   // Test 06 can reuse that filter (don't clear and re-type)
   ```

### When to Use Search in Tests

- **Always** for viewing/editing/deleting specific records (tests 05-09)
- **Not needed** for initial setup (tests 01-04) or listing all records
- **Critical** when table shows 100 records but you need to find 1 specific test record

### Table Component onClick Pattern

Tables must use only `_id` for row clicks (not `_id || id` fallback):

```javascript
// CORRECT - matches AllergyIntolerances, CarePlans pattern
<TableRow onClick={ handleRowClick.bind(this, resources[i]._id)} />

// WRONG - causes issues when both _id and id exist
<TableRow onClick={ handleRowClick.bind(this, resources[i]._id || resources[i].id)} />
```

**Why**: The `_id` is the primary key. Using `_id || id` can pass wrong value when both exist.