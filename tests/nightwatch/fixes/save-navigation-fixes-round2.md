# Save Navigation Fixes - Round 2

## Summary
Applied the save-navigation-helper to 4 more failing tests that were still using the old pattern.

## Tests Fixed

### 1. MedicationAdministrations Test
- **Issue**: Helper was commented but not actually applied
- **Fix**: Properly replaced the save section with helper
- **Lines replaced**: ~80 lines → 8 lines
- **Resource path**: `/medication-administrations`
- **Page ID**: `#medicationAdministrationsPage`

### 2. Procedures Test
- **Issue**: Still using old pattern, causing timeout
- **Fix**: Added helper import and replaced save section
- **Lines replaced**: ~65 lines → 8 lines
- **Resource path**: `/procedures`
- **Page ID**: `#proceduresPage`

### 3. ServiceRequests Test
- **Issue**: Save wasn't completing, table assertion failing
- **Fix**: Added helper import and replaced save section
- **Lines replaced**: ~60 lines → 8 lines
- **Resource path**: `/service-requests`
- **Page ID**: `#serviceRequestsPage`

### 4. Communications Test
- **Issue**: Custom save button ID, row click failing
- **Fix**: Added helper with dynamic button text detection
- **Lines replaced**: ~70 lines → 15 lines (includes button text detection)
- **Resource path**: `/communications`
- **Page ID**: `#communicationsPage`
- **Special handling**: Communications uses `#saveCommunicationButton` with potentially different text

## Pattern Applied

### Standard Pattern (medicationadministrations, procedures, servicerequests):
```javascript
// Save using the helper for reliable navigation
saveNavigationHelper.saveWithDiagnostics(browser, {
  resourceType: 'resourceName',
  listPageId: '#resourcePage',
  listPagePath: '/resource-path',
  expectedRedirect: true
});
```

### Communications Pattern (custom button handling):
```javascript
// Check actual button text first
browser.execute(function() {
  const saveButton = document.querySelector('#saveCommunicationButton');
  if (saveButton) {
    return saveButton.textContent;
  }
  return null;
}, [], function(result) {
  const buttonText = result.value && !result.value.includes('Save') ? result.value : 'Save';
  
  saveNavigationHelper.saveWithDiagnostics(browser, {
    resourceType: 'communications',
    listPageId: '#communicationsPage',
    listPagePath: '/communications',
    expectedRedirect: true,
    saveButtonText: buttonText
  });
});
```

## Benefits
1. **Consistent navigation**: Helper ensures navigation back to list page
2. **Better error detection**: Comprehensive error checking
3. **CI reliability**: Longer timeouts and fallback navigation
4. **Code reduction**: 60-80 lines reduced to 8-15 lines per test

## Remaining Tests to Fix
Based on the initial list, these tests may still need the helper applied:
1. `crud.conditions.js`
2. `crud.encounters.js`
3. `crud.questionnaireresponses.js`
4. `crud.researchstudy.js`
5. `crud.researchsubjects.js`
6. `crud.measures.js`

## Notes
- The save-navigation-helper looks for buttons containing "Save" by default
- Some tests may use different button text (e.g., "Create", "Update")
- The helper accepts a `saveButtonText` parameter for custom button text
- Always check if the test is already using the helper before applying fixes