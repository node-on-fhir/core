

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
**IMPORTANT**: Import the collection directly instead of using Meteor.startup
```javascript
// Import the collection directly - avoids timing issues
import { {ResourceTypes} } from '/imports/lib/schemas/SimpleSchemas/{ResourceTypes}';

// DO NOT USE THIS PATTERN (causes timing issues):
// let {ResourceTypes};
// Meteor.startup(function(){
//   {ResourceTypes} = Meteor.Collections.{ResourceTypes};
// });
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
**File**: `/configs/settings.honeycomb.localhost.json` (or relevant settings file)
**CRITICAL - Three places to configure**:

1. **Enable autopublish**:
   ```json
   "public": {
     "defaults": {
       "autopublish": true
     }
   }
   ```

2. **Enable the module**:
   ```json
   "public": {
     "modules": {
       "fhir": {
         "{ResourceTypes}": true
       }
     }
   }
   ```

3. **Configure REST API and publication**:
   ```json
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
   ```

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

2. **No data showing after save / "Encounters are in database but not in browser cursors"**:
   - Check THREE places in settings:
     * `public.defaults.autopublish: true`
     * `public.modules.fhir.{ResourceTypes}: true`
     * `private.fhir.rest.{ResourceType}` exists with `publication: true`
   - Verify collection is imported directly (not via Meteor.startup)
   - Check which settings file is being used: `ps aux | grep meteor | grep settings`
   - Restart Meteor server after settings changes
   - Debug in console:
     * `window.{ResourceTypes}.find().fetch()`
     * `Meteor.settings.public.defaults.autopublish`
     * Check network tab for subscription calls

3. **Table only shows 2 columns**:
   - Test is running in portrait mode
   - Add `windowSize('current', 1400, 900)` to test

4. **Form fields not editable**:
   - Ensure `setIsEditing(true)` for new resources
   - Check `disabled={!isEditing}` on fields

5. **Author/Subject/Practitioner not showing in table**:
   - Check FhirDehydrator flatten function
   - Verify data structure matches (e.g., `author.display` vs `authorDisplay`)
   - For Encounters: practitioner data is in `participant` array:
     ```javascript
     // Extract practitioner from participant array
     if(Array.isArray(get(encounter, 'participant'))){
       encounter.participant.forEach(function(participant){
         if(get(participant, 'individual.display')){
           result.practitionerDisplay = get(participant, 'individual.display');
           result.practitionerReference = get(participant, 'individual.reference', '');
         }
       });
     }
     ```

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

## Additional Learned Insights

### Test Handling for Empty States
When implementing delete functionality, tests should handle both table and "No Data Available" states:
```javascript
// Check for either table or no-data message
const hasTable = document.querySelector('#encountersTable') !== null;
const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                    document.querySelector('#encountersPage').textContent.includes('No Data Available');
const validState = hasTable || hasNoDataCard;
```

### Schema Export Naming
Ensure schema exports match the expected names:
```javascript
// Correct
export { Encounter, EncounterSchemaDstu2, EncounterSchema, EncounterSchemaStu3 }

// Watch for typos like 'ncounterSchemaDstu2'
```

### FhirDehydrator Updates
When adding flatten functions, ensure all required fields are extracted:
- Check test data structure for expected fields
- Handle both single references and arrays (e.g., participant array)
- Support multiple field naming conventions (reason vs reasonCode)

### Import Path Consistency
Be consistent with import paths:
```javascript
// Table imports should match directory structure
import EncountersTable from '../ui-fhir/encounters/EncountersTable';
// NOT from '../ui-tables/EncountersTable'
```


## Recent Implementation Insights (Questionnaires CRUD)

### Page Component Styling
When implementing the {ResourceTypes}Page component, ensure consistent styling with ConditionsPage:
1. **Use Box container** with proper sx props instead of div with inline styles
2. **Include header section** with:
   - Typography for title and resource count
   - Sort toggle buttons (ascending/descending) 
   - Add {ResourceType} button
3. **Style the table card** with borderRadius, boxShadow, and border
4. **Match no-data state** styling with centered Box, styled Card, and proper button

### No-Data State Requirements
The test expects an "Add Your First {ResourceType}" button in the no-data state:
```javascript
// Required structure for no-data state
<Button
  variant="outlined"
  startIcon={<AddIcon />}
  onClick={handleAdd{ResourceType}}
>
  Add Your First {ResourceType}
</Button>
```

### Table Component Updates
When the test expects specific columns (e.g., publisher for Questionnaires):
1. Check what fields the flatten function returns
2. Add the column to the table component:
   - Add `hide{FieldName}` prop with default false
   - Create `render{FieldName}()` and `render{FieldName}Header()` functions
   - Add to table row rendering in correct position
   - Add to table header in same position
   - Add to PropTypes validation

### Import Test Methods
If tests use `test.createTestUser`, ensure test methods are imported:
```javascript
// In server/main.js
import '../imports/accounts/server/test-methods.js';
```

### Table Row Click Handler
Ensure the table passes the correct ID to row click handler:
```javascript
// Use _id or id, whichever exists
onClick={selectRow.bind(this, item._id || item.id)}
```

### Clean Code Practices
1. Remove unused imports (FormControl, Input, InputAdornment if not needed)
2. Remove unused variables (classes, cardWidth, etc.)
3. Remove commented-out code
4. Use consistent import patterns for collections

## Implementation Checklist Summary

- [ ] Use `/imports/ui-fhir/conditions` as gold standard template for styling
- [ ] Use camelCase for directory name; PascalCase for file names
- [ ] Create `{ResourceTypes}Page.jsx` with modern styling (Box, Typography, etc.)
- [ ] Create `{ResourceTypes}Table.jsx` with all expected columns
- [ ] Create `{ResourceType}Detail.jsx` with proper form fields
- [ ] Import `{ResourceType}Detail.jsx` in App.jsx (often missed!)
- [ ] Create/verify schema in `/imports/lib/schemas/SimpleSchemas`
- [ ] Check/update flatten{ResourceType} method in `/imports/lib/FhirDehydrator`
- [ ] Add routes in App.jsx (list, new, detail)
- [ ] Create Meteor methods in `/imports/api/{resourceTypes}/methods.js`
- [ ] Import methods in `/server/main.js`
- [ ] Import test methods if needed
- [ ] Register collection in 3 places (server, client, autopublish)
- [ ] Configure settings in 3 places (autopublish, module, REST)
- [ ] Attach {ResourceTypes}Table to Meteor.Tables object
- [ ] Add "Add {ResourceType}" button in both data and no-data states
- [ ] Test and fix any missing columns or functionality
- [ ] Clean up unused code and imports
- [ ] Restart Meteor server after settings changes

## ResearchStudy Implementation Learnings

### 1. Settings File Verification
**Critical**: Always verify which settings file is being used by the running application
```bash
# Check the actual settings file in use
ps aux | grep meteor | grep settings

# Common issue: Using wrong settings file
# Expected: meteor run --settings configs/settings.honeycomb.localhost.json
# Actual: meteor run --settings configs/settings.honeycomb.tdd.json
```
When tests fail with "Match failed [400]" or data isn't showing, first check you're updating the correct settings file!

### 2. Method Call Debugging
When getting "Match failed [400]" errors:
1. **Check server console for detailed error**:
   ```
   Exception while invoking method 'researchStudies.update' Error: Match error: Expected string, got null
   ```
   This shows the exact validation failure

2. **Debug method calls in Detail component**:
   ```javascript
   console.log('handleSave called with id:', id, 'id === "new":', id === 'new', 'typeof id:', typeof id);
   ```

3. **Common issue**: Component calling update instead of create
   - Check if `id === 'new'` condition is working
   - Handle cases where id might be undefined: `if (!id || id === 'new')`

### 3. Schema Validation and CodeableConcepts
**Issue**: SimpleSchema expects specific data structures for FHIR types
- `status`: Expects a simple string, not an object
- `phase`, `category`, `focus`: Expect CodeableConcept structure

**Solution**: Transform data before save:
```javascript
// Convert simple string to CodeableConcept
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

### 4. Delete Button Visibility
**Issue**: Delete test failing because it tries to enter edit mode first
**Learning**: Delete button is visible when NOT in edit mode
```javascript
// Wrong approach in test:
// Click Edit button first, then Delete

// Correct approach:
// Click Delete button directly (it's visible in view mode)
```

### 5. Handling Empty State After Deletion
Tests must handle both scenarios after deletion:
```javascript
// Either research studies table or no-data message is valid
const hasTable = document.querySelector('#researchStudiesTable') !== null;
const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                    document.querySelector('#researchStudiesPage').textContent.includes('No Data Available');
return hasTable || hasNoDataCard;
```

### 6. Route Parameter Handling
When using `useParams()` to get the ID:
- Handle undefined/null cases: `const [isEditing, setIsEditing] = useState(!id || id === 'new');`
- Apply same logic throughout component for consistency

### 7. Console Error Messages Can Be Misleading
**Learning**: "Update error" in console doesn't always mean update method was called
- The error message comes from the client-side error handler
- Check server logs for the actual method being called
- In our case, it was still the create method failing validation

## Common Resource Page Improvements and Patterns

When implementing or improving FHIR resource pages (e.g., Conditions, CarePlans, Procedures, etc.), apply these patterns:

### 1. **Handle MongoDB ObjectID Rendering**
- Use `extractIdString()` helper function in FhirDehydrator to safely convert MongoDB ObjectIDs to strings
- Prevents "Objects are not valid as a React child" error caused by ObjectIDs with `{_str: "..."}` structure
- Update renderBarcode functions in table components to handle ObjectIDs properly:
```javascript
const idString = typeof id === 'object' && id._str ? id._str : String(id);
```

### 2. **Implement Patient-Based Data Filtering**
- Use `FhirUtilities.addPatientFilterToQuery()` to filter resources by selected patient
- Update both client-side filtering and server-side subscriptions:
```javascript
const selectedPatientId = Session.get('selectedPatientId');
const query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
const resources = {ResourceTypes}.find(query).fetch();
```
- Pass query to subscription for server-side filtering:
```javascript
Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 1000 });
```

### 3. **Add Table Column Visibility Controls**
- Implement toggle buttons in the header for common columns:
  - **Person icon** (👤) - Toggle Patient/Subject Name column
  - **Code icon** ({}) - Toggle Patient/Subject Reference column  
  - **Badge icon** (🎫) - Toggle System ID/Barcode column
- Use Material-UI ToggleButtonGroup with state management:
```javascript
const [showPatientName, setShowPatientName] = useState(false);
const [showPatientReference, setShowPatientReference] = useState(false);
const [showSystemId, setShowSystemId] = useState(false);
```

### 4. **Fix Form Factor Override Issues**
- Store original prop values before form factor switch:
```javascript
const hidePatientNameFromProp = hidePatientName;
const hideBarcodeFromProp = hideBarcode;
```
- Preserve user preferences in form factor cases:
```javascript
hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
```

### 5. **Implement Proper Pagination**
- Use Session variable for page index:
```javascript
onSetPage={function(index){
  Session.set('{ResourceTypes}Table.{resourceTypes}Index', index)
}}
```
- Track page state with useTracker:
```javascript
data.{resourceTypes}Index = useTracker(function(){
  return Session.get('{ResourceTypes}Table.{resourceTypes}Index')
}, [])
```

### 6. **Optimize Table Row Count**
- Use `LayoutHelpers.calcTableRows()` for dynamic row calculation
- Account for prominent header when patient is selected
- Ensure proper spacing for all UI elements
- The helper automatically adjusts for:
  - Selected patient header space
  - Pagination controls
  - Various margins and paddings

### 7. **Implement Privacy by Default**
- Hide patient-identifying information by default when viewing a specific patient's data
- Support URL parameters for override: `?hidePatientName=false`
- Provide visual toggle controls for easy access

### 8. **Consistent Implementation Across Resources**
- Apply these patterns consistently across all resource types
- Use the same prop names and patterns (e.g., `hideSubject` for CarePlans, `hidePatientName` for Conditions)
- Maintain similar UI/UX patterns for user familiarity

### Example Implementation for New Resource Type:
```javascript
// In {ResourceTypes}Page.jsx
const [showPatientName, setShowPatientName] = useState(false);
const selectedPatientId = Session.get('selectedPatientId');
const query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);

// In subscription
Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 1000 });

// In table props
<{ResourceTypes}Table
  hidePatientName={!showPatientName}
  hidePatientReference={!showPatientReference}
  hideBarcode={!showSystemId}
  onSetPage={function(index){
    Session.set('{ResourceTypes}Table.{resourceTypes}Index', index)
  }}
/>
```

These patterns ensure consistent behavior, improved performance, and better user experience across all FHIR resource pages.