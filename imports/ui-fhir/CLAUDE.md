Well, yeah!  Let's start by using the /import/ui-fhir/condition directory and 

When creating a new FHIR resource in this directory:

- Use the /import/ui-fhir/condition as gold standard template.
- Use camelCase for the directory name; and ProperCase for the file names.
- Make sure to include a {Resource}Page and {Resources}Table 
- Create a schema in /imports/lib/schemas/SimpleSchemas
- Add dehydrate/flatten methods in /imports/lib/FhirDehydrator
- Add conditional routes in App.jsx
- Attach the {Resources}Table to the Meteor.Tables object.
- Add a collection count in PatientSidebar.jsx

# FHIR Resource TDD Test Implementation Guide

## Overview
This document outlines the necessary implementation steps to make FHIR resource CRUD TDD tests pass. Use this as a template when implementing any FHIR resource type (e.g., Condition, Observation, Procedure, etc.).

Replace the following placeholders throughout implementation:
- `{ResourceType}` - PascalCase singular (e.g., Condition, Observation)
- `{resourceType}` - camelCase singular (e.g., condition, observation)
- `{ResourceTypes}` - PascalCase plural (e.g., Conditions, Observations)
- `{resourceTypes}` - camelCase plural (e.g., conditions, observations)

## Test Requirements
The test suite performs the following operations:
1. Setup test environment with user login and patient creation
2. Navigate to {resourceTypes} list page
3. Create new {resourceType} with form validation
4. View {resourceType} details
5. Update existing {resourceType}
6. Delete {resourceType}
7. Test form validation

## Common Implementation Checklist

### 1. Collection Initialization
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page.jsx`
**Fix**: Add `let {ResourceTypes};` before the Meteor.startup block
```javascript
let {ResourceTypes};

Meteor.startup(function(){
  {ResourceTypes} = Meteor.Collections.{ResourceTypes};
});
```

### 2. Subscription Management
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page.jsx`
**Fix**: Use only autopublish subscription when enabled
```javascript
Meteor.subscribe('autopublish.{ResourceTypes}');
// Remove duplicate subscriptions like '{resourceTypes}.all'
```

### 3. Page Index Function
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page.jsx`
**Fix**: Define missing set{ResourceTypes}PageIndex function or remove reference

### 4. Button Text Consistency
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page.jsx`
**Fix**: Ensure button text matches test expectations:
- "Add {ResourceType}" 
- "Add Your First {ResourceType}"

### 5. Required Form Field IDs
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceType}Detail.jsx`
**Required Base IDs**:
- `#{resourceType}DetailPage` - Container element
- `#patientDisplay` - Patient reference field (if applicable)
- `#notesTextarea` - Notes/text field

**Resource-Specific IDs** (examples):
For Conditions:
- `#asserterDisplay` - Practitioner who asserted
- `#snomedCode` - SNOMED code
- `#snomedDisplay` - SNOMED display name
- `#clinicalStatus` - Clinical status select
- `#verificationStatus` - Verification status select
- `#category` - Category select
- `#recordedDate` - Date recorded
- `#onsetDate` - Onset date

For Observations:
- `#performerDisplay` - Who performed observation
- `#loincCode` - LOINC code
- `#loincDisplay` - LOINC display name
- `#status` - Observation status
- `#valueQuantity` - Numeric value
- `#valueUnit` - Unit of measure
- `#effectiveDateTime` - When observed

### 6. Meteor Methods
**File**: `/imports/api/{resourceTypes}/methods.js`
**Required Methods**:
- `create{ResourceType}` - Create new {resourceType}
- `update{ResourceType}` - Update existing {resourceType}
- `remove{ResourceType}` - Delete {resourceType}

**File**: `/imports/api/accounts/methods.js`
**Required Method**:
- `test.createTestUser` - Create test user for login (shared across all resources)

### 7. Autopublish Configuration
**File**: `/server/autopublish.js`
**Action**: Ensure {ResourceTypes} collection is included in autopublish list
```javascript
if(Meteor.Collections.{ResourceTypes}){
  Meteor.Collections.{ResourceTypes}.find().forEach(function(record){
    console.log('{ResourceTypes}', record);
  });
}
```

### 8. Default New Resource JSON Structure
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceType}Detail.jsx`
**Required**: Default FHIR {ResourceType} resource structure

**Example for Condition**:
```javascript
{
  resourceType: "Condition",
  clinicalStatus: {
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
      code: "active"
    }]
  },
  verificationStatus: {
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      code: "confirmed"
    }]
  },
  category: [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/condition-category",
      code: "problem-list-item"
    }]
  }],
  code: {
    coding: [{
      system: "http://snomed.info/sct",
      code: "",
      display: ""
    }]
  },
  subject: {
    reference: "",
    display: ""
  },
  asserter: {
    reference: "",
    display: ""
  },
  recordedDate: "",
  onsetDateTime: "",
  note: [{
    text: ""
  }]
}
```

**Example for Observation**:
```javascript
{
  resourceType: "Observation",
  status: "final",
  code: {
    coding: [{
      system: "http://loinc.org",
      code: "",
      display: ""
    }]
  },
  subject: {
    reference: "",
    display: ""
  },
  performer: [{
    reference: "",
    display: ""
  }],
  effectiveDateTime: "",
  valueQuantity: {
    value: null,
    unit: "",
    system: "http://unitsofmeasure.org"
  }
}
```

### 9. Test User Method Implementation
**File**: `/imports/api/accounts/methods.js`
**Required**: Implement `test.createTestUser` method
```javascript
Meteor.methods({
  'test.createTestUser': function(userData) {
    // Check if user already exists
    const existingUser = Accounts.findUserByUsername(userData.username);
    if (existingUser) {
      return existingUser._id;
    }
    
    // Create new user
    const userId = Accounts.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password
    });
    
    return userId;
  }
});
```

### 10. Patient Selection in Session
**Required Session Variables**:
- `Session.get('selectedPatientId')` - The selected patient's ID
- `Session.get('selectedPatient')` - The selected patient object

**Implementation**: Set these when a patient is selected from the patient list or created

### 11. Table Configuration
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Table.jsx`
**Required**:
- Table element with id `#{resourceTypes}Table`
- Clickable rows that navigate to detail view
- Proper column display for resource data

## Implementation Priority
1. Fix {ResourceTypes} collection initialization (Critical)
2. Add missing element IDs to {ResourceType}Detail form (Critical)
3. Implement test.createTestUser method (Critical)
4. Fix subscription management (Important)
5. Ensure default FHIR resource structure (Important)
6. Fix missing function references (Important)
7. Verify autopublish includes {ResourceTypes} (Important)
8. Configure table for proper display and interaction (Important)

## Testing Commands
```bash
# Run specific resource test
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js

# Run with screenshots
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js --screenshot-path ./screenshots

# Run all CRUD tests
npm test -- tests/nightwatch/honeycomb/crud.*.js
```

## Common Test Patterns

### Navigation Tests
```javascript
browser
  .url('http://localhost:3000/{resourceTypes}')
  .waitForElementVisible('#{resourceTypes}Page', 5000)
```

### Form Field Updates
```javascript
// Text fields
browser
  .click('#fieldId')
  .keys([browser.Keys.COMMAND, 'a'])
  .keys(browser.Keys.BACK_SPACE)
  .setValue('#fieldId', 'new value')

// Material-UI Select fields
browser.execute(function(value) {
  const select = document.querySelector('#selectId');
  select.click();
  setTimeout(() => {
    const options = document.querySelectorAll('li[role="option"]');
    for (let option of options) {
      if (option.getAttribute('data-value') === value) {
        option.click();
        break;
      }
    }
  }, 300);
}, ['selected-value']);
```

## Notes
- The application uses Meteor v3 async patterns
- Material-UI v5 Select components require special handling in tests
- Tests use programmatic login via Meteor.loginWithPassword
- Patient must be selected in Session before creating patient-related resources
- Form validation is currently minimal (allows empty fields)
- Use consistent naming patterns across all resources
- Follow FHIR R4 specifications for resource structure 
