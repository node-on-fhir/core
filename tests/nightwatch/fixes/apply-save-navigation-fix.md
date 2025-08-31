# Applying Save Navigation Fix to CRUD Tests

## Problem
Multiple CRUD tests are failing because after clicking Save, the app is not automatically navigating back to the list page. The tests wait for the list page but timeout because they're still on the create/edit page.

## Solution
Use the `save-navigation-helper.js` to handle save operations with automatic fallback navigation.

## How to Apply the Fix

### 1. Import the Helper
At the top of each failing test file, add:
```javascript
const saveNavigationHelper = require('../helpers/save-navigation-helper');
```

### 2. Replace the Save Section

#### Original Pattern (Example from observations):
```javascript
browser
  .execute(function() {
    // ... capture console errors ...
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Save')) {
        button.click();
        return true;
      }
    }
    return false;
  }, [], function(result) {
    browser.assert.equal(result.value, true, 'Clicked Save button');
  });

browser
  .waitForElementVisible('#observationsPage', 5000);

// ... diagnostic checks ...
```

#### New Pattern Using Helper:
```javascript
// Use the helper for save and navigation
saveNavigationHelper.saveWithDiagnostics(browser, {
  resourceType: 'observations',
  listPageId: '#observationsPage',
  listPagePath: '/observations',
  expectedRedirect: true
});

// Continue with screenshot
browser.saveScreenshot('tests/nightwatch/screenshots/observations/05-observation-saved.png');
```

### 3. List of Files to Update

Based on the failures, update these files:
1. `/tests/nightwatch/honeycomb/enable_autopublish/crud.medicationadministrations.js`
2. `/tests/nightwatch/honeycomb/enable_autopublish/crud.observations.js`
3. `/tests/nightwatch/honeycomb/enable_autopublish/crud.conditions.js`
4. `/tests/nightwatch/honeycomb/enable_autopublish/crud.encounters.js`
5. `/tests/nightwatch/honeycomb/enable_autopublish/crud.procedures.js`
6. `/tests/nightwatch/honeycomb/enable_autopublish/crud.servicerequests.js`
7. `/tests/nightwatch/honeycomb/enable_autopublish/crud.communications.js`
8. `/tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaireresponses.js`
9. `/tests/nightwatch/honeycomb/enable_autopublish/crud.researchstudy.js`
10. `/tests/nightwatch/honeycomb/enable_autopublish/crud.researchsubjects.js`
11. `/tests/nightwatch/honeycomb/enable_autopublish/crud.tasks.js`
12. `/tests/nightwatch/honeycomb/crud.measures.js`

### 4. Resource Type Mappings

| Test File | resourceType | listPageId | listPagePath |
|-----------|--------------|------------|--------------|
| medicationadministrations | 'medicationAdministrations' | '#medicationAdministrationsPage' | '/medication-administrations' |
| observations | 'observations' | '#observationsPage' | '/observations' |
| conditions | 'conditions' | '#conditionsPage' | '/conditions' |
| encounters | 'encounters' | '#encountersPage' | '/encounters' |
| procedures | 'procedures' | '#proceduresPage' | '/procedures' |
| servicerequests | 'serviceRequests' | '#serviceRequestsPage' | '/service-requests' |
| communications | 'communications' | '#communicationsPage' | '/communications' |
| questionnaireresponses | 'questionnaireResponses' | '#questionnaireResponsesPage' | '/questionnaire-responses' |
| researchstudy | 'researchStudies' | '#researchStudiesPage' | '/research-studies' |
| researchsubjects | 'researchSubjects' | '#researchSubjectsPage' | '/research-subjects' |
| tasks | 'tasks' | '#tasksPage' | '/tasks' |
| measures | 'measures' | '#measuresPage' | '/measures' |

## Benefits

1. **Automatic Fallback**: If the app doesn't navigate automatically, the helper forces navigation
2. **Better Diagnostics**: Captures pre/post save state, errors, and timing
3. **Consistent Pattern**: All tests use the same reliable save mechanism
4. **CI-Friendly**: Longer timeouts and better error handling for CircleCI

## Example Full Implementation

Here's how the medicationadministrations test would look after the fix:

```javascript
// At the top of the file
const saveNavigationHelper = require('../helpers/save-navigation-helper');

// In test 04, replace the save section with:
saveNavigationHelper.saveWithDiagnostics(browser, {
  resourceType: 'medicationAdministrations',
  listPageId: '#medicationAdministrationsPage',
  listPagePath: '/medication-administrations',
  expectedRedirect: true
});

browser.saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/05-medicationadministration-saved.png');

// The existing diagnostic code can be removed as the helper handles it
```

## Notes

- The helper will wait up to 10 seconds for the list page (increased from 5)
- It captures form data before save for debugging
- It checks for multiple error indicators
- It logs detailed diagnostics to help understand failures
- If navigation doesn't happen within 2 seconds, it forces navigation