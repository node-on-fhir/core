

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

## CRITICAL: Collection Registration Steps

### 1. Server-Side Collection Registration
**File**: `/server/main.js`
**Actions**: 
- Import the collection schema
- Add to Meteor.Collections object
- Add to global.Collections object

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

### 2. Client-Side Collection Registration
**File**: `/imports/startup/client/collections.js`
**Actions**:
- Import the collection
- Add to Meteor.Collections
- Add to window object for console access

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
**File**: `/server/publications/autopublish.js`
**Actions**:
- Import the collection
- Add to collectionsMap

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

## Common Implementation Checklist

### 1. Collection Initialization in Components
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
**Fix**: Use proper subscription with autopublish check
```javascript
// Subscribe to {ResourceTypes}
useTracker(function(){
  let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
  if(autoPublishEnabled){
    return Meteor.subscribe('autopublish.{ResourceTypes}', {}, {});
  } else {
    return Meteor.subscribe('{resourceTypes}.all');
  }
}, []);
```

### 3. Routes Configuration
**File**: `/imports/ui/App.jsx`
**Fix**: Ensure routes match test expectations (usually plural, lowercase, hyphenated)
```javascript
// Correct format:
<Route path="/{resourceTypes}" element={<{ResourceTypes}Page />} />
<Route path="/{resourceTypes}/new" element={<{ResourceType}Detail />} />
<Route path="/{resourceTypes}/:id" element={<{ResourceType}Detail />} />

// Note: Some resources use hyphens (e.g., /care-plans vs /careplans)
// Check the test file for the expected URL format
```

### 4. Detail Page Implementation
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceType}Detail.jsx`
**Use ConditionDetail as Template**: Copy `/imports/ui-fhir/conditions/ConditionDetail.jsx` and modify

**Key Requirements**:
1. **Container ID**: `id="{resourceType}DetailPage"`
2. **Patient Search**: Include SearchIcon in patient field
3. **Form Field IDs**: Must match test expectations
4. **Edit Mode**: Start in edit mode for new resources
5. **Save Button ID**: `id="save{ResourceType}Button"`

**Patient Field with Search Icon**:
```javascript
<TextField
  id="subjectDisplay"  // or patientDisplay
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

### 5. Resource Schema Fields
**File**: Look at `/imports/lib/schemas/SimpleSchemas/{ResourceTypes}.js`
**Action**: Map schema fields to form inputs with correct IDs

Common field patterns:
- `subject` → Patient reference with search
- `author/performer/asserter` → Practitioner reference
- `code` → Coding system (SNOMED, LOINC, etc.)
- `status` → Select dropdown
- `period.start/end` → Date fields
- `note[0].text` → Notes textarea

### 6. Table Component
**File**: `/imports/ui-fhir/{resourceTypes}/{ResourceTypes}Table.jsx`
**Fix Logger**: Ensure logger has all required methods
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

### 7. Meteor Methods
**File**: `/imports/api/{resourceTypes}/methods.js`
**Required Methods**:
- `create{ResourceType}` - Create new {resourceType}
- `update{ResourceType}` - Update existing {resourceType}
- `remove{ResourceType}` - Delete {resourceType}

**Import in server/main.js**:
```javascript
import '../imports/api/{resourceTypes}/methods.js';
```

### 8. Test Viewport Size
**File**: `tests/nightwatch/honeycomb/crud.{resourceTypes}.js`
**Fix**: Set browser to landscape mode for table visibility
```javascript
before(browser => {
  browser
    .windowSize('current', 1400, 900)  // Set to landscape/desktop size
    .url('http://localhost:3000')
    .waitForElementVisible('body', 5000);
});
```

### 9. Settings Configuration
**File**: `/configs/settings.honeycomb.localhost.json`
**Ensure**:
- `public.defaults.autopublish: true`
- Resource is enabled in `public.modules.fhir.{ResourceTypes}: true`

## Step-by-Step Implementation Process

1. **Create Schema** (if not exists):
   - Check `/imports/lib/schemas/SimpleSchemas/{ResourceTypes}.js`
   - Use existing schema or create based on FHIR R4 spec

2. **Register Collection Everywhere**:
   - Server: `/server/main.js`
   - Client: `/imports/startup/client/collections.js`
   - Autopublish: `/server/publications/autopublish.js`

3. **Copy Template Components**:
   - Copy entire `/imports/ui-fhir/conditions/` directory
   - Rename to `/imports/ui-fhir/{resourceTypes}/`
   - Rename files: `ConditionDetail.jsx` → `{ResourceType}Detail.jsx`, etc.

4. **Update Component Code**:
   - Replace all "Condition" with "{ResourceType}"
   - Replace all "condition" with "{resourceType}"
   - Update form fields to match resource schema
   - Update field IDs to match test expectations

5. **Configure Routes**:
   - Update `/imports/ui/App.jsx` with correct paths

6. **Create/Update Methods**:
   - Create `/imports/api/{resourceTypes}/methods.js`
   - Import in `/server/main.js`

7. **Run Tests**:
   ```bash
   npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js
   ```

8. **Debug Issues**:
   - Check browser console for errors
   - Verify collection exists: `{ResourceTypes}.find().fetch()` in console
   - Check subscriptions: `Meteor.connection._subscriptions`
   - Review test output for missing elements/IDs

## Common Issues and Solutions

1. **Collection not found on client**:
   - Verify registration in `/imports/startup/client/collections.js`
   - Check browser console: `window.{ResourceTypes}`

2. **No data showing after save**:
   - Check autopublish settings
   - Verify subscription is active
   - Add debug logging to subscription

3. **Table only shows 2 columns**:
   - Test is running in portrait mode
   - Add `windowSize('current', 1400, 900)` to test

4. **Form fields not editable**:
   - Ensure `setIsEditing(true)` for new resources
   - Check `disabled={!isEditing}` on fields

5. **Author/Subject not showing in table**:
   - Check FhirDehydrator flatten function
   - Verify data structure matches (e.g., `author.display` vs `authorDisplay`)

## Testing Commands
```bash
# Run specific resource test
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js

# Run with verbose output
npm test -- tests/nightwatch/honeycomb/crud.{resourceTypes}.js --verbose

# Run all CRUD tests
npm test -- tests/nightwatch/honeycomb/crud.*.js
```

## Notes
- The application uses Meteor v3 async patterns
- Material-UI v5 Select components require special handling in tests
- Tests use programmatic login via Meteor.loginWithPassword
- Patient must be selected in Session before creating patient-related resources
- Form validation is currently minimal (allows empty fields)
- Use consistent naming patterns across all resources
- Follow FHIR R4 specifications for resource structure
- Always test in browser console first: `{ResourceTypes}.find().fetch()`


- Use the /import/ui-fhir/condition as gold standard template.
- Use camelCase for the directory name; and ProperCase for the file names.
- Make sure to include a {Resource}Page and {Resources}Table 
- Create a schema in /imports/lib/schemas/SimpleSchemas
- Add dehydrate/flatten methods in /imports/lib/FhirDehydrator
- Add conditional routes in App.jsx
- Attach the {Resources}Table to the Meteor.Tables object.
- Add a collection count in PatientSidebar.jsx