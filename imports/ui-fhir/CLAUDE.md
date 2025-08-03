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
Configure THREE places in `/configs/settings.{configfile}.json`:

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
- Verify registration in all 3 places
- Check console: `window.{ResourceTypes}`
- Ensure direct import (no Meteor.startup)

### 2. No Data After Save
- Check settings configuration (all 3 places)
- Verify correct settings file is loaded
- Restart server after settings changes
- Debug: `window.{ResourceTypes}.find().fetch()`

### 3. Table Missing Columns
- Check FhirDehydrator flatten function
- Verify test expectations
- Add missing render functions

### 4. Patient Filtering Not Working
- Use FHIR id, not MongoDB _id
- Check FhirUtilities.addPatientFilterToQuery()
- Verify patient reference format

### 5. Form Validation Errors
- Check schema expectations
- Transform data before save (e.g., CodeableConcepts)
- Handle null/undefined values

### 6. Delete Button Issues
- Delete button visible in view mode, not edit mode
- Handle both table and no-data states after deletion

---

## Advanced Patterns

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
  - [ ] Configure settings in 3 places
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