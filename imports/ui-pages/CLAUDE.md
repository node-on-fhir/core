# ui-pages Virtual Directory

This directory serves as a virtual component-type-centric view of FHIR Page components.

## Architecture Decision

We maintain a **hybrid organization pattern**:
- **Physical files** live in resource-centric directories (`/ui-fhir/{resourceType}/`)
- **Virtual indexes** provide component-type views (`/ui-tables/`, `/ui-pages/`, `/ui-details/`)

This approach provides the best of both worlds:
1. Developers can find all components for a resource in one place
2. Cross-resource patterns and shared behaviors are managed centrally

## Structure

### index.js
- Exports all Page components from their resource locations
- Provides `getAllPages()` function for programmatic access
- Auto-registers pages on `Meteor.Pages` at startup

## Usage

### Import individual pages:
```javascript
import { PatientsPage, ConditionsPage } from '/imports/ui-pages';
```

### Import all pages:
```javascript
import * as Pages from '/imports/ui-pages';
// or
import { getAllPages } from '/imports/ui-pages';
```

### Access via Meteor.Pages:
```javascript
// After Meteor.startup()
const PatientsPage = Meteor.Pages.PatientsPage;
```

## Adding New Pages

1. Create the page in `/imports/ui-fhir/{resourceType}/{ResourceType}sPage.jsx`
2. Add the export to `/imports/ui-pages/index.js`
3. Add to the `getAllPages()` function

## Patterns and Best Practices

All Page components should follow these patterns:

### 1. Component Structure
- Import Table component and use it to display data
- Include header with title, icons, and action buttons
- Handle both data and no-data states
- Include column visibility toggles

### 2. Data Management
- Use `useTracker` for reactive data
- Support patient filtering via Session
- Handle loading states
- Implement proper error handling

### 3. Navigation
- Use `useNavigate` hook for routing
- Implement "Add New" button that navigates to detail page
- Support row click navigation to detail view

### 4. State Management
```javascript
// Column visibility
const [showPatientName, setShowPatientName] = useState(false);
const [showPatientReference, setShowPatientReference] = useState(false);
const [showSystemId, setShowSystemId] = useState(false);

// Sort state
const [sortDirection, setSortDirection] = useState('asc');
const [sortField, setSortField] = useState('');
```

### 5. Header Pattern
```javascript
<Box>
  <Grid container justifyContent="space-between" alignItems="center">
    <Grid item>
      <Typography variant="h4">{ResourceType}s</Typography>
    </Grid>
    <Grid item>
      <Button startIcon={<AddIcon />} onClick={handleAdd}>
        Add {ResourceType}
      </Button>
    </Grid>
  </Grid>
</Box>
```

### 6. No-Data State
```javascript
{data.resources.length === 0 && (
  <Card className="no-data-card">
    <CardContent>
      <Typography variant="h6">No {ResourceType}s Found</Typography>
      <Button onClick={handleAdd}>Add Your First {ResourceType}</Button>
    </CardContent>
  </Card>
)}
```

## Testing

Page components are tested via:
- Unit tests for data subscriptions
- E2E tests via Nightwatch (crud.{resourceType}.js)
- Manual testing with different data states

## Common Page Types

1. **List Pages** - Display table with CRUD operations
2. **Designer Pages** - Complex UI for building resources (e.g., CarePlanDesigner)
3. **Detail Pages** - Combined with Detail components for inline editing
4. **Partial Pages** - Components meant to be embedded in other pages

## Migration Status

As of the last update:
- ✅ All Page components indexed
- ✅ Virtual index created
- ⏳ App.jsx pending update to use index imports