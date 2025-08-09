# FHIR Resource Implementation Guide

## Overview
This guide provides comprehensive instructions for implementing FHIR resource types in the Honeycomb application, including CRUD operations, UI components, and test-driven development.

**Placeholder Conventions:**
- `{ResourceType}` - PascalCase singular (e.g., Condition, Observation)
- `{resourceType}` - camelCase singular (e.g., condition, observation)
- `{ResourceTypes}` - PascalCase plural (e.g., Conditions, Observations)
- `{resourceTypes}` - camelCase plural (e.g., conditions, observations)

**Note:** Some resources use hyphenated URLs (e.g., /care-plans, /allergy-intolerances)

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Collection Registration](#collection-registration)
3. [Component Implementation](#component-implementation)
4. [Patient Filtering](#patient-filtering)
5. [UI Patterns](#ui-patterns)
6. [Testing](#testing)
7. [Common Issues](#common-issues)
8. [Advanced Patterns](#advanced-patterns)

---

## Prerequisites

### Settings Configuration
Configure TWO places in `/configs/settings.{configfile}.json`:

1. **Enable the module**:
```json
{
  "public": {
    "modules": {
      "fhir": {
        "{ResourceTypes}": true
      }
    }
  }
}
```

2. **Configure REST API**:
```json
{
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

**IMPORTANT:** Verify which settings file is being used:
```bash
ps aux | grep meteor | grep settings
```

---

## Collection Registration

### 1. Server-Side Registration
**File:** `/server/main.js`

```javascript
// Import the schema
import { {ResourceTypes} } from '../imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

// Add to Meteor.Collections (around line 104)
Meteor.Collections = {
  // ... other collections
  {ResourceTypes},
  // ... more collections
}

// Add to global.Collections (around line 174)
global.Collections = {
  // ... other collections
  {ResourceTypes},
  // ... more collections
}
```

### 2. Client-Side Registration
**File:** `/imports/startup/client/collections.js`

```javascript
// Import
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

// Add to Meteor.Collections
Meteor.Collections = {
  // ... other collections
  {ResourceTypes},
  // ... more collections
};

// Add to window for console access
window.{ResourceTypes} = {ResourceTypes};
```

### 3. Autopublish Registration
**File:** `/server/publications/autopublish.js`

```javascript
// Import
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

// Add to collectionsMap
const collectionsMap = {
  // ... other collections
  '{ResourceTypes}': {ResourceTypes},
  // ... more collections
};
```

---

## Component Implementation

### Directory Structure
```
/imports/ui-fhir/{resourceTypes}/
├── {ResourceTypes}Page.jsx      # List view
├── {ResourceTypes}Table.jsx     # Table component
└── {ResourceType}Detail.jsx     # Create/Edit form
```

### 1. Page Component ({ResourceTypes}Page.jsx)

**Key Requirements:**
- Import collections directly (no Meteor.startup)
- Use modern Material-UI patterns (Box, Typography)
- Include header with sort toggles and column visibility controls
- Handle both data and no-data states

```javascript
import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

// Direct imports - avoid timing issues
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

// ... component implementation
```

### 2. Table Component ({ResourceTypes}Table.jsx)

**Key Requirements:**
- Handle MongoDB ObjectID rendering
- Support column visibility toggles
- Implement proper pagination
- Include all expected columns from tests

**Logger setup:**
```javascript
const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};
```

### 3. Detail Component ({ResourceType}Detail.jsx)

**Key Requirements:**
- Container ID: `id="{resourceType}DetailPage"`
- Save button ID: `id="save{ResourceType}Button"`
- Start in edit mode for new resources
- Include patient search functionality

**Patient field with search:**
```javascript
<TextField
  id="subjectDisplay"
  fullWidth
  label="Patient"
  value={get({resourceType}, 'subject.display', '')}
  onChange={(e) => handleChange('subject.display', e.target.value)}
  disabled={!isEditing}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <Tooltip title="Search for patient">
          <IconButton
            onClick={handleSearchUser}
            edge="end"
            disabled={!isEditing}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    ),
  }}
/>
```

### 4. Routes Configuration
**File:** `/imports/ui/App.jsx`

```javascript
import {ResourceTypes}Page from '../ui-fhir/{resourceTypes}/{ResourceTypes}Page';
import {ResourceType}Detail from '../ui-fhir/{resourceTypes}/{ResourceType}Detail';

// In routes
<Route path="/{resourceTypes}" element={<{ResourceTypes}Page />} />
<Route path="/{resourceTypes}/new" element={<{ResourceType}Detail />} />
<Route path="/{resourceTypes}/:id" element={<{ResourceType}Detail />} />
```

### 5. Meteor Methods
**File:** `/imports/api/{resourceTypes}/methods.js`

```javascript
Meteor.methods({
  'create{ResourceType}': function(data) {
    // Implementation
  },
  'update{ResourceType}': function(id, data) {
    // Implementation
  },
  'remove{ResourceType}': function(id) {
    // Implementation
  }
});
```

**Import in:** `/server/main.js`
```javascript
import '../imports/api/{resourceTypes}/methods.js';
```

### 6. FhirDehydrator Updates
**File:** `/imports/lib/FhirDehydrator.js`

Add flatten function:
```javascript
export function flatten{ResourceType}({resourceType}) {
  let result = {
    _id: extractIdString(get({resourceType}, '_id', '')),
    id: get({resourceType}, 'id', ''),
    // ... other fields
    patientDisplay: get({resourceType}, 'patient.display', ''),
    patientReference: get({resourceType}, 'patient.reference', ''),
    // Keep display and reference separate - no fallback
  };
  
  return result;
}
```

---

## Patient Filtering

### Critical Implementation Pattern

**1. Use FHIR ID for filtering:**
```javascript
const selectedPatient = Session.get('selectedPatient');
const fhirId = get(selectedPatient, 'id'); // FHIR resources use FHIR id, not MongoDB _id
```

**2. Subscription pattern:**
```javascript
const isLoading = useTracker(() => {
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
  
  let query = {};
  
  if(selectedPatient || selectedPatientId) {
    const fhirId = get(selectedPatient, 'id');
    
    if(fhirId) {
      query = FhirUtilities.addPatientFilterToQuery(fhirId);
    } else if(selectedPatientId) {
      query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
    }
  }
  
  if(autoPublishEnabled){
    const handle = Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 1000 });
    return !handle.ready();
  } else {
    const handle = Meteor.subscribe('{resourceTypes}.all');
    return !handle.ready();
  }
}, [Session.get('selectedPatientId')]); // Only track selectedPatientId to avoid loops
```

**3. Data tracker pattern:**
```javascript
data.{resourceTypes} = useTracker(function(){
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  
  const fhirId = get(selectedPatient, 'id');
  const patientIdToUse = fhirId || selectedPatientId;
  
  const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
  return {ResourceTypes}.find(query).fetch();
}, [])
```

**4. Debug logging pattern:**
```javascript
useEffect(() => {
  return () => {
    Session.set('{ResourceTypes}Page.debugLogged', false);
  };
}, []);

// In data tracker
if(!Session.get('{ResourceTypes}Page.debugLogged')) {
  Session.set('{ResourceTypes}Page.debugLogged', true);
  
  console.log('{ResourceTypes} data - MongoDB _id:', selectedPatientId);
  console.log('{ResourceTypes} data - FHIR id:', fhirId);
  console.log('{ResourceTypes} data - query:', query);
}
```

---

## UI Patterns

### 1. Column Visibility Controls
```javascript
// State management
const [showPatientName, setShowPatientName] = useState(false);
const [showPatientReference, setShowPatientReference] = useState(false);
const [showSystemId, setShowSystemId] = useState(false);

// Toggle buttons
<ToggleButtonGroup>
  <ToggleButton value="patientName" aria-label="show patient name">
    <PersonIcon /> {/* Shows patient display name */}
  </ToggleButton>
  <ToggleButton value="patientReference" aria-label="show patient reference">
    <CodeIcon /> {/* Shows FHIR reference (Patient/[id]) */}
  </ToggleButton>
  <ToggleButton value="systemId" aria-label="show system id">
    <BadgeIcon /> {/* Shows MongoDB _id */}
  </ToggleButton>
</ToggleButtonGroup>

// Pass to table
<{ResourceTypes}Table
  hidePatientDisplay={!showPatientName}
  hidePatientReference={!showPatientReference}
  hideBarcode={!showSystemId}
/>
```

### 2. Form Factor Handling
In table components, preserve user preferences:
```javascript
// Store original prop values
const hidePatientDisplayFromProp = hidePatientDisplay;
const hidePatientReferenceFromProp = hidePatientReference;
const hideBarcodeFromProp = hideBarcode;

// In form factor cases
case "web":
  hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
  hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
  hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
  break;
```

### 3. MongoDB ObjectID Handling
```javascript
function renderBarcode(id){
  if (!hideBarcode) {
    const idString = typeof id === 'object' && id._str ? id._str : String(id);
    return (
      <TableCell><span className="barcode">{idString}</span></TableCell>
    );
  }
}
```

### 4. Patient Column Separation
Keep patient display and reference as separate columns:
```javascript
// In table component
function renderPatientNameHeader(){
  if (!hidePatientDisplay) {
    return <TableCell className='patientDisplay'>Patient Name</TableCell>;
  }
}

function renderPatientReferenceHeader(){
  if (!hidePatientReference) {
    return <TableCell className='patientReference'>Patient Reference</TableCell>;
  }
}
```

### 5. No-Data State
```javascript
<Button
  variant="outlined"
  startIcon={<AddIcon />}
  onClick={handleAdd{ResourceType}}
>
  Add Your First {ResourceType}
</Button>
```

---

## Testing

### Test Setup
```javascript
before(browser => {
  browser
    .windowSize('current', 1400, 900)  // Landscape mode for table visibility
    .url('http://localhost:3000')
    .waitForElementVisible('body', 5000);
});
```

### Running Tests
```bash
# Single resource
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js

# With verbose output
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js --verbose

# All CRUD tests
npm test -- tests/nightwatch/honeycomb/crud.*.js
```

### Handle Empty States
```javascript
const hasTable = document.querySelector('#{resourceTypes}Table') !== null;
const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                    document.querySelector('#{resourceTypes}Page').textContent.includes('No Data Available');
const validState = hasTable || hasNoDataCard;
```

---

## Common Issues

### 1. Collection Not Found
- Verify registration in settings file
- Check console: `window.{ResourceTypes}`
- Ensure direct import (no Meteor.startup)

### 2. No Data After Save
- Check settings configuration (all 3 places)
- Verify correct settings file is loaded
- Restart server after settings changes
- Debug: `window.{ResourceTypes}.find().fetch()`
- **Check patient reference**: Ensure patient is set in Session before save
- **Verify user authentication**: Methods may fail silently if not logged in

### 3. Table Missing Columns
- Check FhirDehydrator flatten function
- Verify test expectations
- Add missing render functions

### 4. Patient Filtering Not Working
- Use FHIR id, not MongoDB _id
- Check FhirUtilities.addPatientFilterToQuery()
- Verify patient reference format
- **Debug with unfiltered count**: Compare total records vs filtered records
```javascript
console.log('Total records:', {ResourceTypes}.find({}).count());
console.log('Filtered records:', {ResourceTypes}.find(query).count());
```

### 5. Form Validation Errors
- Check schema expectations
- Transform data before save (e.g., CodeableConcepts)
- Handle null/undefined values
- **Empty patient reference**: Session patient may not be set

### 6. Delete Button Issues
- Delete button visible in view mode, not edit mode
- Handle both table and no-data states after deletion

### 7. Search Not Working
- Ensure search field has correct ID for tests
- Pass query to subscription, not filter in tracker
- Check that searchable fields match your schema structure

### 8. Sort Order Confusion
- Mixed ID types (ObjectID vs String) sort differently
- Don't assume position in list without explicit sort
- Use search to find specific records in tests

---

## Advanced Patterns

### Search Functionality Implementation

**Client-Side vs Server-Side Search:**
- **Best Practice**: Implement search on the client-side when working with autopublish subscriptions
- **Pattern**: Pass search query to subscription, let server filter the data

```javascript
// In Page component
const [searchFilter, setSearchFilter] = useState('');

const isLoading = useTracker(() => {
  let query = {};
  if(searchFilter && searchFilter.length > 0) {
    query = {
      $or: [
        {'_id': searchFilter},
        {'id': searchFilter},
        {'{resourceType}Name.0.name': {$regex: searchFilter, $options: 'i'}},
        {'manufacturer': {$regex: searchFilter, $options: 'i'}},
        // Add other searchable fields
      ]
    };
  }
  
  const handle = Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 100 });
  return !handle.ready();
}, [searchFilter]);

// Search input
<TextField
  id="{resourceType}SearchInput"
  fullWidth
  placeholder="Search {resourceTypes} by ID, name, ..."
  value={searchFilter}
  onChange={(e) => setSearchFilter(e.target.value)}
/>
```

**Important Notes:**
- Don't filter in the data tracker - let the subscription handle it
- The autopublish subscription respects the query parameter
- This avoids loading all data and filtering client-side

### Handling Large Datasets with Pagination

**Pagination Limits:**
- Default limit: 100 records (configurable)
- Maximum limit: 1000 records (hard cap for performance)
- Always specify limits in subscriptions to avoid performance issues

```javascript
// In autopublish.js
Meteor.publish('autopublish.{ResourceTypes}', function(query, options) {
  query = query || {};
  options = options || {};
  
  // Cap at reasonable limit
  options.limit = options.limit || 100;
  if (options.limit > 1000) {
    options.limit = 1000;
  }
  
  // Default sort by most recent first
  if (!options.sort) {
    options.sort = { '_id': -1 };
  }
  
  return {ResourceTypes}.find(query, options);
});
```

### MongoDB ObjectID vs Meteor String ID Sorting

**The Challenge:**
- Synthea data uses MongoDB ObjectIDs (24-char hex strings)
- New records via UI use Meteor string IDs (17-char random strings)
- These sort differently, causing new records to appear at unexpected positions

**Solution Pattern:**
```javascript
// In server methods, optionally use MongoDB ObjectID
if (process.env.USE_MONGO_OBJECTID) {
  const { Mongo } = Package.mongo;
  const objectId = new Mongo.ObjectID();
  cleanResource._id = objectId.toHexString();
} else {
  cleanResource._id = cleanResource.id; // Default Meteor behavior
}
```

**Testing Strategy:**
- Don't rely on specific positions in sorted lists
- Use search functionality to find specific test records
- Or click the first row when sorted by _id descending (newest first)

### Navigation After Save Operations

**Pattern for Smooth Navigation:**
```javascript
// In Detail component save handler
Meteor.call('create{ResourceType}', dataToSave, (error, result) => {
  if (error) {
    console.error('Error creating {resourceType}:', error);
    // Show error to user
  } else {
    console.log('{ResourceType} created successfully:', result);
    // Navigate back to list
    navigate('/{resourceTypes}');
  }
});
```

**Common Navigation Issues:**
- Staying on /new page after save indicates silent failure
- Check for console errors or validation issues
- Ensure user is logged in (methods may require authentication)

### Material-UI Select Component Testing

**Testing Limitations:**
- Material-UI Select components use portals for dropdown rendering
- Options appear outside the normal DOM hierarchy
- Standard Nightwatch selectors may not work

**Testing Pattern:**
```javascript
// Click the select to open dropdown
browser.execute(function(value) {
  const select = document.querySelector('#typeSelect');
  if (select) {
    select.click();
    setTimeout(() => {
      // Options render in a portal, need to search globally
      const options = document.querySelectorAll('li[role="option"]');
      for (let option of options) {
        if (option.getAttribute('data-value') === value) {
          option.click();
          break;
        }
      }
    }, 300); // Wait for portal to render
  }
}, [testValue]);
```

### Finding Specific Records in Large Datasets

**Use Search Instead of Scanning:**
```javascript
// In tests, search for specific record
browser
  .waitForElementVisible('#{resourceType}SearchInput', 5000)
  .clearValue('#{resourceType}SearchInput')
  .setValue('#{resourceType}SearchInput', testResource.name)
  .pause(1000); // Wait for search results

// Then interact with filtered results
```

**Benefits:**
- Avoids complex row-finding logic
- Works regardless of sort order
- Much faster than scanning all rows
- More reliable with dynamic data

### CodeableConcept Transformation
```javascript
if (dataToSave.phase && typeof dataToSave.phase !== 'object') {
  dataToSave.phase = {
    coding: [{
      system: 'http://hl7.org/fhir/research-study-phase',
      code: dataToSave.phase,
      display: phaseMap[dataToSave.phase] || dataToSave.phase
    }],
    text: phaseMap[dataToSave.phase] || dataToSave.phase
  };
}
```

### Complex Reference Extraction
```javascript
// For resources with nested references (e.g., Encounter.participant)
if(Array.isArray(get(encounter, 'participant'))){
  encounter.participant.forEach(function(participant){
    if(get(participant, 'individual.display')){
      result.practitionerDisplay = get(participant, 'individual.display');
      result.practitionerReference = get(participant, 'individual.reference', '');
    }
  });
}
```

### Import Test Methods
If tests use `test.createTestUser`:
```javascript
// In server/main.js
import '../imports/accounts/server/test-methods.js';
```

---

## Implementation Checklist

- [ ] **Prerequisites**
  - [ ] Configure settings in settings file
  - [ ] Verify correct settings file is loaded
  
- [ ] **Collection Setup**
  - [ ] Register in server/main.js
  - [ ] Register in client collections.js
  - [ ] Register in autopublish.js
  
- [ ] **Components**
  - [ ] Create {ResourceTypes}Page with modern styling
  - [ ] Create {ResourceTypes}Table with all columns
  - [ ] Create {ResourceType}Detail with form fields
  - [ ] Import Detail component in App.jsx
  
- [ ] **Data Layer**
  - [ ] Create/verify SimpleSchema
  - [ ] Add flatten{ResourceType} to FhirDehydrator
  - [ ] Create Meteor methods
  - [ ] Import methods in server/main.js
  
- [ ] **Routes & Navigation**
  - [ ] Add routes to App.jsx
  - [ ] Verify URL format (hyphenated?)
  
- [ ] **UI Features**
  - [ ] Add column visibility toggles
  - [ ] Implement patient filtering
  - [ ] Add sort controls
  - [ ] Handle no-data state
  
- [ ] **Testing**
  - [ ] Set viewport to landscape
  - [ ] Run tests and fix issues
  - [ ] Clean up unused code
  
- [ ] **Final Steps**
  - [ ] Restart Meteor server
  - [ ] Test in browser console
  - [ ] Verify all functionality

---

## Key Principles

1. **Always use direct imports** - Never use Meteor.startup for collections
2. **FHIR resources use FHIR id** - Not MongoDB _id for references
3. **Keep display and reference separate** - Don't fallback reference to display
4. **Test settings file** - Always verify which settings file is active
5. **Handle all states** - Both data and no-data scenarios
6. **Use existing patterns** - Copy from working resources like Conditions
7. **Clean code** - Remove unused imports and commented code

This guide represents the collective knowledge from implementing multiple FHIR resource types. Follow these patterns for consistent, maintainable implementations.

---

## Debugging Reference

### Patient Context Management in Tests
**Problem**: Tests were failing because patient context was lost between test steps, causing "No rows found" or "Only Synthea consents are visible" errors.

**Solution**: Re-establish patient context at the beginning of each test that needs it:
```javascript
// Re-establish patient context in each test
browser.execute(function(testIdentifier) {
  if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
    let patient = Patients.findOne({'identifier.value': testIdentifier});
    if (!patient) {
      patient = Patients.findOne({
        $or: [
          { 'name.0.text': { $regex: 'John.*Doe' } },
          { 'name.0.family': 'Doe' },
          { 'name.0.given.0': 'John' }
        ]
      });
    }
    if (patient) {
      Session.set('selectedPatientId', patient._id);
      Session.set('selectedPatient', patient);
      return { success: true, patientId: patient._id };
    }
  }
  return { success: false };
}, ['test-patient-' + timestamp]);
```

### Search-Based Test Pattern
**Problem**: Complex row-finding logic was unreliable with multiple test runs and varying data.

**Solution**: Use search functionality to filter the list before interacting with rows:
```javascript
// Search for specific test record
browser
  .waitForElementVisible('#consentSearchInput', 5000)
  .clearValue('#consentSearchInput')
  .setValue('#consentSearchInput', testConsent.patientName)
  .pause(1000);

// Then click the first row after filtering
browser.execute(function() {
  const rows = document.querySelectorAll('#consentsTable tbody tr');
  if (rows.length > 0) {
    rows[0].click();
    return { clicked: true };
  }
  return { clicked: false };
});
```

### JavaScript Closure Issues in Tables
**Problem**: "Cannot read properties of undefined (reading '_id')" error when clicking table rows.

**Solution**: Use block-scoped variables to capture values at iteration time:
```javascript
// Bad - closure issue
for (var i = 0; i < consentsToRender.length; i++) {
  rows.push(
    <TableRow onClick={() => handleRowClick(consentsToRender[i]._id)}>
  );
}

// Good - proper closure handling
for (let i = 0; i < consentsToRender.length; i++) {
  const currentConsent = consentsToRender[i];
  const consentId = currentConsent._id;
  rows.push(
    <TableRow onClick={() => handleRowClick(consentId)}>
  );
}
```

### Subscription Pattern for Detail Components
**Problem**: Detail page showed empty fields when navigating directly via URL.

**Solution**: Add subscription in detail components to ensure data loads:
```javascript
// Subscribe to consents and track subscription status
const isSubscriptionReady = useTracker(function(){
  let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
  let handle;
  if(autoPublishEnabled){
    handle = Meteor.subscribe('autopublish.Consents', {}, {});
  } else {
    handle = Meteor.subscribe('consents.all');
  }
  return handle.ready();
}, []);

// Load data when subscription is ready
useEffect(() => {
  if (id && isSubscriptionReady) {
    const existingConsent = Consents.findOne({_id: id});
    if (existingConsent) {
      setConsent(existingConsent);
      setIsEditing(false);
    }
  }
}, [id, isSubscriptionReady]);
```

### Native Select Handling in Tests
**Problem**: Material-UI Select components with native prop require different handling than non-native selects.

**Solution**: Set value directly and dispatch change event:
```javascript
browser.execute(function(value) {
  const selectElement = document.querySelector('#statusSelect');
  if (selectElement) {
    selectElement.value = value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}, [updatedConsent.status]);
```

### Button Text Context Awareness
**Problem**: Save button text changes based on context (new vs edit).

**Solution**: Check for appropriate button text:
```javascript
// In ConsentDetail.jsx
{id ? 'Update' : 'Save'} Consent

// In tests, look for the right text
if (button.textContent.includes('Update')) {
  button.click();
  return true;
}
```

### Delete Button Visibility
**Problem**: Delete button was being looked for in edit mode, but it's only visible in view mode.

**Solution**: Click delete button directly without entering edit mode first:
```javascript
// Delete button is visible in view mode, not edit mode
browser
  .waitForElementVisible('#consentDetailPage', 5000)
  .execute(function() {
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Delete')) {
        button.click();
        return true;
      }
    }
  })
  .pause(500)
  .acceptAlert(); // Handle confirmation dialog
```

### FhirDehydrator Category Display
**Problem**: Test was looking for category code but table displays the text value.

**Solution**: Understand how FhirDehydrator transforms data:
```javascript
// FhirDehydrator.js
if(has(document, 'category[0].text')){
  result.category = get(document, 'category[0].text')
} else {
  result.category = get(document, 'category[0].coding[0].display', '')
}

// Test expects display text, not code
const expectedCategoryDisplay = 'Research information access';
browser.assert.ok(result.value.tableText.includes(expectedCategoryDisplay));
```

### Search Filter in Page Component
**Problem**: Need to add search functionality with proper query building.

**Solution**: Implement search with MongoDB query operators:
```javascript
if(searchFilter && searchFilter.length > 0) {
  const searchQuery = {
    $or: [
      {'_id': searchFilter},
      {'id': searchFilter},
      {'status': {$regex: searchFilter, $options: 'i'}},
      {'category.0.coding.0.display': {$regex: searchFilter, $options: 'i'}},
      {'category.0.coding.0.code': {$regex: searchFilter, $options: 'i'}},
      {'patient.display': {$regex: searchFilter, $options: 'i'}}
    ]
  };
}
```

### Test Data Persistence
**Problem**: Updated test data (notes field) made it harder to find records in subsequent tests.

**Solution**: Search for multiple possible values:
```javascript
const searchStrings = [
  `Test consent created at ${timestamp}`,
  `Test consent updated at ${timestamp}`
];

for (let searchString of searchStrings) {
  const consentDoc = Consents.findOne({
    'note.0.text': { $regex: searchString }
  });
  if (consentDoc) {
    consentId = consentDoc._id;
    break;
  }
}
```

### Summary of Debugging Best Practices

1. **Always re-establish Session context** in tests after navigation
2. **Use search to filter lists** before clicking rows in tests
3. **Handle both create and update scenarios** for button text
4. **Understand component lifecycle** - when is data available vs when is UI rendered
5. **Use proper variable scoping** in loops to avoid closure issues
6. **Add subscriptions in detail components** for direct URL navigation
7. **Test native selects differently** than Material-UI portal-based selects
8. **Know which mode (view/edit) components are in** for different operations
9. **Build flexible search queries** that handle multiple possible values
10. **Understand data transformations** between FHIR format and display format