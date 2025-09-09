# CRUD Test Analysis Report

## Overview
Analysis of CRUD test files in `/tests/nightwatch/honeycomb/` directory:
- Total CRUD test files: 36
- Files using save-navigation-helper: 14
- Files with skip logic (window.__skip): 2

## Files Using save-navigation-helper (14 files)

1. crud.diagnosticreports.js
2. crud.immunizations.js
3. crud.careteams.js
4. crud.questionnaireresponses.js
5. crud.tasks.js
6. crud.servicerequests.js
7. crud.encounters.js
8. crud.plandefinitions.js
9. crud.measures.js
10. crud.messageheaders.js
11. crud.communications.js
12. crud.procedures.js
13. crud.medicationadministrations.js
14. crud.observations.js

### Save Navigation Helper Usage Pattern
```javascript
const saveNavigationHelper = require('../../helpers/save-navigation-helper');

// Usage in test:
saveNavigationHelper.saveWithDiagnostics(browser, {
  resourceType: 'observations',
  listPageId: '#observationsPage',
  listPagePath: '/observations',
  expectedRedirect: true
});
```

## Files with Skip Logic (2 files)

1. **crud.tasks.js**
   - Uses `window.__skipTaskUpdateTest` flag
   - Skips update test if no task rows are found
   
2. **crud.servicerequests.js**
   - Uses `window.__skipServiceRequestUpdateTest` flag
   - Skips update test if no table is found or in no-data state

### Skip Logic Pattern
```javascript
// Set skip flag when condition is met
browser.execute(function() {
  window.__skipTaskUpdateTest = true;
});

// Check skip flag before continuing
browser.execute(function() {
  return window.__skipTaskUpdateTest === true;
}, [], function(result) {
  if (result.value) {
    console.log('Skipping remainder of update test');
    return;
  }
  // Continue with test...
});
```

## Test Structure Consistency

### Standard CRUD Test Pattern
All CRUD tests follow a similar 10-step pattern:

1. **01. Setup test environment** - Login, create test patient, clean up old data
2. **02. Verify [resource] list page loads** - Navigate to list page
3. **03. Navigate to new [resource] form** - Click Add button
4. **04. Create new [resource]** - Fill form and save
5. **05. Verify new [resource] appears in list** - Check list page
6. **06. View [resource] details** - Click on row to view
7. **07. Update existing [resource]** - Edit and save changes
8. **08. Verify updated [resource] in list** - Check updates appear
9. **09. Delete [resource]** - Delete the resource
10. **10. Verify [resource] removed from list** - Confirm deletion

## Common Patterns and Issues

### 1. Patient Context Management
Most tests need to maintain patient context across navigation:
```javascript
// Re-establish patient context after navigation
browser.execute(function(testIdentifier) {
  if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
    let patient = Patients.findOne({'identifier.value': testIdentifier});
    if (patient) {
      Session.set('selectedPatientId', patient._id);
      Session.set('selectedPatient', patient);
    }
  }
}, ['test-patient-' + timestamp]);
```

### 2. Navigation Issues
- Files NOT using save-navigation-helper manually handle navigation after save
- Session data is often lost during navigation
- Some tests use manual URL navigation which clears Session state

### 3. Material-UI Select Component Handling
Complex pattern for handling MUI Select components:
```javascript
browser.execute(function(status) {
  const statusSelect = document.querySelector('#statusSelect');
  if (statusSelect) {
    statusSelect.click();
    setTimeout(() => {
      const options = document.querySelectorAll('li[role="option"]');
      for (let option of options) {
        if (option.getAttribute('data-value') === status) {
          option.click();
          break;
        }
      }
    }, 300);
  }
}, [testValue]);
```

### 4. Search and Filter Issues
Many tests struggle with finding created resources due to:
- Patient filtering
- Timing issues
- Subscription updates

### 5. Timestamp Usage
All tests use timestamp for uniqueness:
```javascript
const timestamp = Date.now();
const testData = {
  name: `Test ${timestamp}`,
  notes: `Created at ${timestamp}`
};
```

## Shared Test Utilities

All CRUD tests import `shared-test-utils.js` which provides:

1. **ensureCleanState()** - Logs out users and clears test data
2. **logoutUser()** - Logs out current user
3. **createTestUser()** - Creates test user via Meteor method
4. **generateTestCredentials()** - Generates unique test credentials
5. **createTestPatient()** - Creates test patient via Meteor method
6. **clearTestPatients()** - Clears test patient data

### Common Usage Pattern
```javascript
const testUtils = require('./shared-test-utils');

// In test setup:
testUtils.createTestPatient(browser, {
  name: 'John Doe',
  family: 'Doe',
  given: 'John',
  identifier: 'test-patient-' + timestamp
}, function(result) {
  // Handle result
});
```

## Recommendations

1. **Standardize save-navigation-helper usage** - All CRUD tests should use it for consistency
2. **Implement skip logic consistently** - Create a shared pattern for conditional test execution
3. **Fix patient context persistence** - Improve Session handling across navigation
4. **Create shared test utilities** for:
   - Material-UI component interaction
   - Patient context management (extend existing utilities)
   - Search and filter operations
5. **Add more diagnostic logging** for debugging test failures
6. **Consider using data-testid attributes** for more reliable element selection
7. **Extend shared-test-utils.js** with common patterns like:
   - Material-UI Select handling
   - Form filling helpers
   - Navigation with Session preservation
   - Skip logic implementation