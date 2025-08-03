# CRUD Test Implementation Guide

This guide provides patterns and checklists for implementing CRUD tests in the Honeycomb application, based on lessons learned from implementing Conditions and CarePlans tests.

**Placeholder Conventions:**
- `{ResourceType}` - PascalCase singular (e.g., Condition, CarePlan)
- `{resourceType}` - camelCase singular (e.g., condition, carePlan)
- `{ResourceTypes}` - PascalCase plural (e.g., Conditions, CarePlans)
- `{resourceTypes}` - camelCase plural (e.g., conditions, carePlans)

## Core Testing Philosophy

1. **Don't modify tests that have been refined over nearly a decade** - The tests represent business requirements. Adjust the application code to meet the tests, not the other way around.
2. **Test Driven Development (TDD)** - The tests define the expected behavior. Implementation should satisfy these expectations.
3. **Handle both empty and populated databases** - Tests must work whether the database is empty or contains 2.6M+ records.

## Key Patterns and Issues Discovered

### 1. MongoDB ObjectID vs String ID Handling
- **Issue**: Synthea data creates MongoDB ObjectIDs, while Meteor creates string IDs
- **Solution**: Handle both gracefully without modifying tests
  ```javascript
  // In UI components, normalize ObjectIDs
  const idString = typeof id === 'object' && id._str ? id._str : String(id);
  ```

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
- **Solution**: Use proper React event simulation
  ```javascript
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 
    'value'
  ).set;
  nativeInputValueSetter.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  ```

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
- **Lost Context**: Navigation between pages can sometimes lose patient context
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

1. **Don't search by identifier when you can use _id directly**
2. **Don't assume _id === id** (especially with Synthea data)
3. **Don't modify well-established test patterns**
4. **Don't forget to handle the no-data state**
5. **Don't assume specific sort order without explicitly setting it**
6. **Don't expect manually set values for auto-populated fields**
7. **Don't use complex search patterns when simple ones suffice**

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