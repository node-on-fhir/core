# ui-details Virtual Directory

This directory serves as a virtual component-type-centric view of FHIR Detail components.

## Architecture Decision

We maintain a **hybrid organization pattern**:
- **Physical files** live in resource-centric directories (`/ui-fhir/{resourceType}/`)
- **Virtual indexes** provide component-type views (`/ui-tables/`, `/ui-pages/`, `/ui-details/`)

This approach provides the best of both worlds:
1. Developers can find all components for a resource in one place
2. Cross-resource patterns and shared behaviors are managed centrally

## Structure

### index.js
- Exports all Detail components from their resource locations
- Provides `getAllDetails()` function for programmatic access
- Auto-registers details on `Meteor.Details` at startup

## Usage

### Import individual details:
```javascript
import { PatientDetail, ConditionDetail } from '/imports/ui-details';
```

### Import all details:
```javascript
import * as Details from '/imports/ui-details';
// or
import { getAllDetails } from '/imports/ui-details';
```

### Access via Meteor.Details:
```javascript
// After Meteor.startup()
const PatientDetail = Meteor.Details.PatientDetail;
```

## Adding New Details

1. Create the detail in `/imports/ui-fhir/{resourceType}/{ResourceType}Detail.jsx`
2. Add the export to `/imports/ui-details/index.js`
3. Add to the `getAllDetails()` function

## Patterns and Best Practices

All Detail components should follow these patterns:

### 1. Component Structure
- Container div with ID: `id="{resourceType}DetailPage"`
- Save button with ID: `id="save{ResourceType}Button"`
- Delete button visible in view mode, not edit mode
- Support both create and edit modes

### 2. Mode Management
```javascript
const [isEditing, setIsEditing] = useState(!id); // Start in edit mode for new resources
```

### 3. Data Loading
```javascript
useEffect(() => {
  if (id) {
    const resource = {ResourceTypes}.findOne({_id: id});
    if (resource) {
      set{ResourceType}(resource);
    }
  }
}, [id]);
```

### 4. Form Fields
- Use Material-UI TextField components
- Implement consistent label and helper text
- Handle controlled inputs with proper state management
- Support patient search for patient reference fields

### 5. Patient Search Pattern
```javascript
<TextField
  id="patientDisplay"
  fullWidth
  label="Patient"
  value={get(resource, 'patient.display', '')}
  onChange={(e) => handleChange('patient.display', e.target.value)}
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

### 6. Save/Update Pattern
```javascript
const handleSave = async () => {
  const dataToSave = prepareDataForSave(resource);
  
  try {
    if (id) {
      await Meteor.callAsync('update{ResourceType}', id, dataToSave);
    } else {
      const newId = await Meteor.callAsync('create{ResourceType}', dataToSave);
      navigate(`/{resource-types}/${newId}`);
    }
    setIsEditing(false);
  } catch (error) {
    console.error('Error saving {resourceType}:', error);
  }
};
```

### 7. Delete Pattern
```javascript
const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this {resourceType}?')) {
    try {
      await Meteor.callAsync('remove{ResourceType}', id);
      navigate('/{resource-types}');
    } catch (error) {
      console.error('Error deleting {resourceType}:', error);
    }
  }
};
```

### 8. Field Change Handler
```javascript
const handleChange = (path, value) => {
  const updated = {...resource};
  set(updated, path, value);
  set{ResourceType}(updated);
};
```

### 9. CodeableConcept Fields
```javascript
// For select fields that need CodeableConcept transformation
if (dataToSave.category && typeof dataToSave.category !== 'object') {
  dataToSave.category = {
    coding: [{
      system: 'http://hl7.org/fhir/category-system',
      code: dataToSave.category,
      display: categoryMap[dataToSave.category] || dataToSave.category
    }],
    text: categoryMap[dataToSave.category] || dataToSave.category
  };
}
```

### 10. Action Buttons
```javascript
<Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
  {isEditing ? (
    <>
      <Button
        id="save{ResourceType}Button"
        variant="contained"
        color="primary"
        onClick={handleSave}
      >
        {id ? 'Update' : 'Create'} {ResourceType}
      </Button>
      <Button
        variant="outlined"
        onClick={() => id ? setIsEditing(false) : navigate('/{resource-types}')}
      >
        Cancel
      </Button>
    </>
  ) : (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsEditing(true)}
      >
        Edit
      </Button>
      <Button
        variant="outlined"
        color="error"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </>
  )}
</Box>
```

## Testing

Detail components are tested via:
- Unit tests for form validation
- E2E tests via Nightwatch (crud.{resourceType}.js)
- Manual testing of CRUD operations

## Common Patterns by Field Type

### Text Fields
```javascript
<TextField
  fullWidth
  label="Title"
  value={get(resource, 'title', '')}
  onChange={(e) => handleChange('title', e.target.value)}
  disabled={!isEditing}
/>
```

### Date Fields
```javascript
<TextField
  fullWidth
  type="date"
  label="Date"
  value={moment(get(resource, 'date')).format('YYYY-MM-DD')}
  onChange={(e) => handleChange('date', e.target.value)}
  disabled={!isEditing}
  InputLabelProps={{ shrink: true }}
/>
```

### Select Fields
```javascript
<TextField
  fullWidth
  select
  label="Status"
  value={get(resource, 'status', '')}
  onChange={(e) => handleChange('status', e.target.value)}
  disabled={!isEditing}
>
  <MenuItem value="active">Active</MenuItem>
  <MenuItem value="inactive">Inactive</MenuItem>
</TextField>
```

### Reference Fields
```javascript
<TextField
  fullWidth
  label="Practitioner"
  value={get(resource, 'practitioner.display', '')}
  onChange={(e) => handleChange('practitioner.display', e.target.value)}
  disabled={!isEditing}
  helperText="Reference: {get(resource, 'practitioner.reference', '')}"
/>
```

## Migration Status

As of the last update:
- ✅ All Detail components indexed
- ✅ Virtual index created
- ⏳ App.jsx pending update to use index imports