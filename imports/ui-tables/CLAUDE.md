# ui-tables Virtual Directory

This directory serves as a virtual component-type-centric view of FHIR Table components.

## Architecture Decision

We maintain a **hybrid organization pattern**:
- **Physical files** live in resource-centric directories (`/ui-fhir/{resourceType}/`)
- **Virtual indexes** provide component-type views (`/ui-tables/`, `/ui-pages/`, `/ui-details/`)

This approach provides the best of both worlds:
1. Developers can find all components for a resource in one place
2. Cross-resource patterns and shared behaviors are managed centrally

## Structure

### index.js
- Exports all Table components from their resource locations
- Provides `getAllTables()` function for programmatic access
- Auto-registers tables on `Meteor.Tables` at startup

### Legacy Files
The individual Table files in this directory (e.g., `AllergyIntolerancesTable.jsx`) are deprecated duplicates that should be removed. All active development happens in `/ui-fhir/{resourceType}/`.

## Usage

### Import individual tables:
```javascript
import { PatientsTable, ConditionsTable } from '/imports/ui-tables';
```

### Import all tables:
```javascript
import * as Tables from '/imports/ui-tables';
// or
import { getAllTables } from '/imports/ui-tables';
```

### Access via Meteor.Tables:
```javascript
// After Meteor.startup()
const PatientsTable = Meteor.Tables.PatientsTable;
```

## Adding New Tables

1. Create the table in `/imports/ui-fhir/{resourceType}/{ResourceType}sTable.jsx`
2. Add the export to `/imports/ui-tables/index.js`
3. Add to the `getAllTables()` function

## Patterns and Best Practices

All Table components should follow these patterns:

### 1. Props Interface
- `data` - Array of FHIR resources to display
- `selected` - Currently selected row(s)
- `onRowClick` - Row click handler
- `hideBarcode` - Hide MongoDB _id column
- `hidePatientDisplay` - Hide patient name column
- `hidePatientReference` - Hide patient reference column
- `formFactorLayout` - Responsive layout hints

### 2. Column Management
Tables should support dynamic column visibility based on:
- Form factor (mobile, tablet, web)
- User preferences (via props)
- Data availability

### 3. Patient Reference Pattern
Always separate patient display name and reference:
- `patientDisplay` - Human readable name
- `patientReference` - FHIR reference (e.g., "Patient/123")

### 4. Barcode/ID Handling
Handle MongoDB ObjectIDs properly:
```javascript
const idString = typeof id === 'object' && id._str ? id._str : String(id);
```

### 5. Consistent Styling
- Use Material-UI Table components
- Apply `barcode` class to ID columns
- Use consistent header/cell class names

## Testing

Table components are tested via:
- Unit tests for data transformation
- E2E tests via Nightwatch (crud.{resourceType}.js)
- Manual testing with different form factors

## Migration Status

As of the last update:
- ✅ All imports updated to use `/ui-fhir/` paths
- ✅ Virtual index created
- ⏳ Legacy duplicate files pending removal
- ⏳ App.jsx pending update to use index imports