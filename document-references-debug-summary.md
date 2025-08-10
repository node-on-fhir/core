# DocumentReferences CRUD Test Debug Summary

## Issues Identified and Fixed

### 1. Test Logic for Detecting Empty State
**Issue**: Test was incorrectly detecting "No Data Available" when the table was actually showing data.
**Fix**: Changed test logic to only consider it "no data" when there's no table AND the text is present.

### 2. ID Mismatch When Navigating to Detail Page
**Issue**: Table was passing FHIR `id` to navigation, but detail page was querying by MongoDB `_id`.
**Fix**: Changed table to prioritize MongoDB `_id` when navigating to detail page.

### 3. Patient Reference Not Being Set Correctly
**Issue**: Documents are created but not associated with the selected patient.
**Root Cause**: The test creates a patient with a certain ID, but when the document is saved, it's not using the correct patient reference format.

## Current Status

From the data provided, we can see:
- Multiple DocumentReferences exist in the database
- They have different patient references (Patient/tjPi2YPiC4WyXn6za, Patient/oj5ZyQ9teWRwStEcN)
- The test patient has a different ID that doesn't match any of these references
- The filtering is working correctly - showing no documents for the test patient

## Next Steps

1. Ensure patient context is maintained throughout the test flow
2. Verify that the DocumentReferenceDetail component uses the FHIR `id` field when creating patient references
3. Consider adding a helper function to ensure consistent patient reference formatting

## Test Execution

To run the tests:
```bash
npm test -- tests/nightwatch/honeycomb/enable_autopublish/crud.documentreferences.js
```

To run a specific test:
```bash
npm test -- tests/nightwatch/honeycomb/enable_autopublish/crud.documentreferences.js --test "05. Verify new document reference appears in list"
```