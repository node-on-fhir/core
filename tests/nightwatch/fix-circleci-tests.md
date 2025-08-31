# Fixing CircleCI Test Failures

## Summary of Issues

The CircleCI tests are failing due to several timing and login state issues:

1. **Login State Check Returns Null**: The `result.value` is null when checking login state
2. **Navigation Timeouts**: Tests timeout waiting for pages after CRUD operations
3. **Connection Issues**: ECONNRESET errors in CI environment
4. **Element Interaction Failures**: Elements not interactable due to timing

## Solutions Implemented

### 1. Created Helper Modules

#### `/tests/nightwatch/helpers/login-helper.js`
- Robust login state checking with retry logic
- Handles null results gracefully
- Provides `ensureLoggedIn()` function for consistent login

#### `/tests/nightwatch/helpers/circleci-helper.js`
- CircleCI-specific timeouts and retry logic
- `waitForAppReady()` - Ensures Meteor and router are ready
- `navigateWithRetry()` - Navigation with automatic retry
- `saveWithNavigation()` - Save operations with navigation fallback
- `clickElementWithRetry()` - Element interaction with multiple methods

### 2. Updated MeasureReports Test

The MeasureReports test now uses these helpers for better stability:
- Uses `loginHelper.ensureLoggedIn()` instead of inline login check
- Uses `circleHelper.waitForAppReady()` in before hook
- Uses `circleHelper.saveWithNavigation()` for save operations
- Uses `circleHelper.navigateWithRetry()` for page navigation

### 3. Created Test Template

`/tests/nightwatch/honeycomb/crud-test-template.js` provides a template for updating other CRUD tests with the same patterns.

## How to Fix Other Failing Tests

For each failing CRUD test, apply these changes:

### 1. Add Helper Imports
```javascript
const loginHelper = require('../helpers/login-helper');
const circleHelper = require('../helpers/circleci-helper');
```

### 2. Update Before Hook
Replace the existing before hook with:
```javascript
before(browser => {
  console.log('Starting [Resource] CRUD test suite...');
  browser
    .url('http://localhost:3000')
    .waitForElementVisible('body', circleHelper.TIMEOUTS.EXTRA_LONG);
  
  circleHelper.waitForAppReady(browser, function(isReady) {
    if (!isReady) {
      browser.assert.fail('Application failed to become ready');
    }
  });
});
```

### 3. Update Login Check
Replace the login check in test 01 with:
```javascript
loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
  if (!isLoggedIn) {
    browser.assert.fail('Failed to ensure user is logged in');
  } else {
    browser.assert.ok(true, 'User is logged in');
  }
  
  // Your cleanup code here...
});
```

### 4. Update Navigation
Replace navigation patterns with:
```javascript
circleHelper.navigateWithRetry(
  browser,
  'http://localhost:3000/[resource-path]',
  '#[expectedElementId]',
  function(success) {
    if (!success) {
      browser.assert.fail('Failed to navigate to [resource] page');
    }
  }
);
```

### 5. Update Save Operations
Replace save button clicks and navigation with:
```javascript
circleHelper.saveWithNavigation(
  browser,
  'Save', // or 'Update'
  '/[resource-path]',
  '#[resourcePage]'
);
```

## Tests That Need Updates

Based on the CircleCI output, these tests are failing and need the above fixes:

1. `crud.allergyintolerances.js` - Login state check returning null
2. `crud.appointments.js` - Login state check returning null
3. `crud.careplans.js` - Login state check returning null
4. `crud.conditions.js` - Login state check returning null
5. `crud.consents.js` - Login state check returning null
6. `crud.diagnosticreports.js` - Login state check returning null
7. `crud.encounters.js` - Login state check returning null
8. `crud.flags.js` - Login state check returning null
9. `crud.goals.js` - Login state check returning null
10. `crud.immunizations.js` - Navigation timeout after save
11. `crud.medicationadministrations.js` - Navigation timeout
12. `crud.nutritionorders.js` - Login state check returning null
13. `crud.plandefinitions.js` - Login state check returning null
14. `crud.procedures.js` - Login state check returning null
15. `crud.provenance.js` - ECONNRESET error
16. `crud.requestorchestractions.js` - Button click failure
17. `crud.tasks.js` - Login state check returning null

## Testing the Fixes

After applying fixes to a test file:

1. Test locally first:
```bash
npm test -- tests/nightwatch/honeycomb/crud.[resource].js
```

2. If it passes locally, commit and push to trigger CircleCI

3. Monitor CircleCI logs for any remaining issues

## Additional Notes

- The helpers add retry logic and longer timeouts specifically for CI environments
- Console logging is enhanced to help debug issues in CircleCI
- Navigation fallbacks ensure tests don't get stuck on the wrong page
- Login state is checked more robustly with null handling

These fixes should resolve the majority of the CircleCI test failures related to timing and login state issues.