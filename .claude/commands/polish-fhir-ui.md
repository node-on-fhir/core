# Slash Command: /polish-fhir-ui

Apply the polished UI patterns (established by DiagnosticReports) to an existing FHIR resource's components and tests.

## Description

This command transforms an existing FHIR resource's UI from the old pattern (CardActions buttons, barcode in body, Edit/Cancel toggles) to the new polished pattern (header icon group, Lock/Unlock, Preview/Form views, inline Save/Cancel). It reads the existing components, inventories what's there, and walks through the transformation interactively.

## Usage

```
/polish-fhir-ui Observation
/polish-fhir-ui AllergyIntolerance
/polish-fhir-ui Condition
```

The argument is a FHIR ResourceType in PascalCase (singular).

## Instructions

When this command is invoked with a `$ARGUMENTS` resource type, follow these phases exactly.

---

### Phase 1: Discovery

**Derive naming conventions** from the ResourceType argument:

- `{ResourceType}` = PascalCase singular (e.g., `Observation`, `AllergyIntolerance`)
- `{ResourceTypes}` = PascalCase plural (e.g., `Observations`, `AllergyIntolerances`)
- `{resourceTypes}` = camelCase plural (e.g., `observations`, `allergyIntolerances`)

**Read the existing component files:**

1. `imports/ui-fhir/{resourceTypes}/{ResourceType}Detail.jsx`
2. `imports/ui-fhir/{resourceTypes}/{ResourceTypes}Table.jsx`
3. `imports/ui-fhir/{resourceTypes}/{ResourceTypes}Page.jsx`
4. `tests/nightwatch/honeycomb/enable_autopublish/crud.{resourceTypes}.js` (if it exists)

If any of files 1-3 don't exist, stop and inform the user. The resource must have existing components to polish.

**Inventory what exists** by scanning each file for these patterns:

**Detail component — check for:**
- [ ] Barcode location: Is `<span className="barcode">` inside `CardContent` body or `CardHeader` title?
- [ ] Button layout: Are Save/Edit/Delete/Cancel in `<CardActions>` or elsewhere?
- [ ] Edit toggle: Is there an Edit/Cancel button pair, or a Lock/Unlock icon?
- [ ] View modes: Does it support `?view=form` / `?view=page` URL params?
- [ ] Preview view: Does `renderPreviewView()` exist?
- [ ] Delete gating: Is Delete disabled when not in edit mode?
- [ ] `useSearchParams` import: Present or absent?
- [ ] Status color mapping: Does a `statusColorMap` object exist?
- [ ] Header actions: Does `renderHeaderActions()` exist with icon buttons?

**Table component — check for:**
- [ ] Action icons column: Does `renderActionIcons()` with Preview/Edit exist?
- [ ] Notes/conclusion icon: Is `DescriptionIcon` used for text fields, or does it show raw text?
- [ ] Column hide props: What `hide*` props are supported?

**Page component — check for:**
- [ ] Subscription routing: Does autoSubscribe branch use `autopublish.*` or `selectedPatient.*`?
- [ ] No-data state: Does it use `<FhirNoData>` component?
- [ ] Loading state: Does it show loading indicator when `isLoading` is true?
- [ ] Search bar: Does it have a `<TextField>` with `SearchIcon` `InputAdornment`?
- [ ] Sort toggle: `ToggleButtonGroup` with ascending/descending
- [ ] Column visibility toggle: `ToggleButtonGroup` with systemId/patientName/patientReference
- [ ] Category/type filter dropdown: `FormControl` with `Select`
- [ ] Search input: `TextField` with proper ID

**Tests — check for:**
- [ ] Row-finding method: Does it use `textContent.includes(timestamp)` or `textContent.includes(code)`?
- [ ] Delete pattern: Does it click Lock icon before Delete? Does it find Delete by icon data-testid?
- [ ] Search before delete: Does it search to narrow results before finding the row?

**Present the inventory** to the user as a summary. Example:

```
## Discovery: {ResourceType}

### Detail Component
- Barcode: IN BODY (needs move to header)
- Buttons: IN CARDACTIONS (needs migration to header icons + inline save)
- Edit toggle: EDIT/CANCEL BUTTONS (needs Lock/Unlock icon)
- View modes: NONE (needs ?view=form / ?view=page)
- Preview: NONE (needs renderPreviewView)
- Delete gating: NOT GATED (needs isEditing check)
- Status colors: NONE (needs statusColorMap)

### Table Component
- Action icons: NONE (needs Preview + Edit icons)
- Notes icon: RAW TEXT (needs DescriptionIcon)

### Page Component
- Sort toggle: MISSING (needs ToggleButtonGroup)
- Column toggle: MISSING (needs ToggleButtonGroup)
- Category filter: MISSING (needs Select dropdown)
- Search: PRESENT (ID: #{resourceTypes}SearchInput)

### Tests
- Row-finding: USES TIMESTAMP (needs code-based finding)
- Delete: DIRECT CLICK (needs Lock first, icon-based click)
```

---

### Phase 2: Interactive Planning

Present the checklist of polish items and ask the user which ones to apply. Group by component:

**Detail Component:**
- [ ] Move barcode from CardContent body to CardHeader title
- [ ] Add icon button group to CardHeader (Preview, Form, Lock/Unlock, Delete)
- [ ] Add URL-param view switching (`?view=form` / `?view=page`)
- [ ] Add `renderPreviewView()` with formatted document layout
- [ ] Move Save/Cancel buttons from CardActions to inline in form
- [ ] Gate Delete button on edit mode (`disabled={!isEditing}`)
- [ ] Add Lock/Unlock icon toggle (replaces Edit/Cancel button pattern)
- [ ] Add status color mapping for Chip display
- [ ] Remove CardActions section entirely

**Table Component:**
- [ ] Add icon column for notes/conclusion (`DescriptionIcon` instead of text)
- [ ] Add action icons column (Preview + Edit navigation)
- [ ] Update column hide props for new defaults

**Page Component:**
- [ ] Fix subscription routing: `autopublish.*` when autoSubscribe, `selectedPatient.*` otherwise
- [ ] Add `<FhirNoData>` component for empty state
- [ ] Add loading state check (`isLoading` → show nothing or skeleton)
- [ ] Add search `<TextField>` with `SearchIcon` `InputAdornment`
- [ ] Add `ToggleButtonGroup` for sort order (ascending/descending)
- [ ] Add `ToggleButtonGroup` for column visibility (SystemId, PatientName, PatientReference)
- [ ] Add category/type filter dropdown (resource-specific)

**Tests:**
- [ ] Update row-finding to use visible column values (code) instead of timestamp
- [ ] Add Lock icon click before delete (enter edit mode)
- [ ] Update Delete button finder to use `DeleteIcon` data-testid
- [ ] Add search before row-click in delete test

Ask which items to apply (default: all checked items that are currently missing).

---

### Phase 3: Execute Transformations

Apply each checked item using the reference patterns below. Adapt field names, status options, and resource-specific content for the target resource.

#### Reference: Detail Component Patterns

**Import additions** (add any that are missing):
```jsx
import { useSearchParams } from 'react-router-dom';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Chip, Divider, IconButton, Tooltip, Stack } from '@mui/material';
```

**State additions** (add inside the component function):
```jsx
const [searchParams, setSearchParams] = useSearchParams();
const viewMode = searchParams.get('view') || 'form';
```

**Barcode as CardHeader title:**
```jsx
let headerTitle = 'New {ResourceType}';
if (isExistingRecord) {
  headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{recordId}</span>;
}
```

**Header action buttons** (add as a function inside the component):
```jsx
function renderHeaderActions(){
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {!isNewRecord && (
        <Tooltip title="Preview">
          <IconButton
            onClick={() => setSearchParams({ view: 'page' })}
            sx={{ color: viewMode === 'page' ? 'primary.main' : 'text.secondary' }}
          >
            <ArticleIcon />
          </IconButton>
        </Tooltip>
      )}
      {!isNewRecord && (
        <Tooltip title="Form">
          <IconButton
            onClick={() => setSearchParams({ view: 'form' })}
            sx={{ color: viewMode === 'form' ? 'primary.main' : 'text.secondary' }}
          >
            <EditNoteIcon />
          </IconButton>
        </Tooltip>
      )}
      {!isNewRecord && (
        <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
          <IconButton onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <LockOpenIcon /> : <LockIcon />}
          </IconButton>
        </Tooltip>
      )}
      {!isNewRecord && (
        <Tooltip title="Delete">
          <IconButton
            onClick={handleDeleteButton}
            disabled={!isEditing}
            sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
          >
            <DeleteIcon />
            <Typography sx={{
              position: 'absolute', width: '1px', height: '1px',
              padding: 0, margin: '-1px', overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0
            }}>Delete</Typography>
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
```

**CardHeader usage:**
```jsx
<CardHeader
  title={headerTitle}
  sx={{ borderBottom: 1, borderColor: 'divider' }}
  action={renderHeaderActions()}
/>
```

**Inline Save/Cancel** (replaces CardActions):
```jsx
{isEditing && (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2,
    borderTop: 1, borderColor: 'divider' }}>
    <Button id="cancelButton" onClick={handleCancelButton}>Cancel</Button>
    <Button
      id="save{ResourceType}Button"
      onClick={handleSaveButton}
      variant="contained"
      color="primary"
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save'}
    </Button>
  </Box>
)}
```

**Preview view** (adapt fields for the specific resource):
```jsx
function renderPreviewView(){
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const formattedDate = form.effectiveDateTime ? moment(form.effectiveDateTime).format('MMMM D, YYYY') : '';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Subtitle line — resource-specific (category, code, etc.) */}
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {/* Adapt subtitle content per resource */}
      </Typography>

      <Divider />

      {/* Two-column metadata: Patient left, Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Patient</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.subject || 'Unspecified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">Date</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedDate || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Resource-specific content fields */}
      <Box sx={{ py: 3 }}>
        {/* Adapt: show the resource's primary content fields here */}
        {/* e.g., conclusion, notes, value, bodySite, etc. */}
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Record ID: {recordId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
```

**View mode switching in render:**
```jsx
<CardContent>
  {viewMode === 'form' && renderFormView()}
  {viewMode === 'page' && renderPreviewView()}
</CardContent>
```

**Status color map** (adapt values for each resource's status codes):
```jsx
const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'resolved': 'info',
  'final': 'success',
  'preliminary': 'warning',
  'amended': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};
```

**Remove the entire `<CardActions>` section.** All buttons are now either in the header (Preview, Form, Lock, Delete) or inline in the form (Save, Cancel).

#### Reference: Table Component Patterns

**Notes/conclusion as icon:**
```jsx
function renderConclusion(record){
  const conclusion = get(record, 'conclusion', '');
  if(conclusion){
    return <DescriptionIcon fontSize="small" color="action" titleAccess="Has conclusion" />;
  }
  return '';
}
```

Adapt this pattern for whatever text field the resource uses (notes, conclusion, description, etc.). The column header should say "Notes" and use the icon instead of showing raw text.

**Action icons column:**
```jsx
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Visibility';

function renderActionIcons(record){
  if(!hideActionIcons){
    return (
      <TableCell className='actionIcons' style={{minWidth: '120px'}}>
        <IconButton onClick={() => handleRowClick(get(record, '_id'))} size="small">
          <PreviewIcon />
        </IconButton>
        <IconButton onClick={() => handleRowClick(get(record, '_id'))} size="small">
          <EditIcon />
        </IconButton>
      </TableCell>
    );
  }
}
```

Add corresponding header:
```jsx
{!hideActionIcons && (
  <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
)}
```

#### Reference: Page Component Patterns

**Sort toggle:**
```jsx
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const [sortOrder, setSortOrder] = useState('descending');

function handleSortOrderChange(event, newOrder){
  if(newOrder !== null){
    setSortOrder(newOrder);
  }
}

// In header render:
<ToggleButtonGroup
  value={sortOrder}
  exclusive
  onChange={handleSortOrderChange}
  aria-label="sort order"
  size="small"
>
  <ToggleButton value="ascending" aria-label="ascending order">
    <ArrowUpwardIcon />
  </ToggleButton>
  <ToggleButton value="descending" aria-label="descending order">
    <ArrowDownwardIcon />
  </ToggleButton>
</ToggleButtonGroup>
```

**Column visibility toggle:**
```jsx
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';

const [showSystemId, setShowSystemId] = useState(false);
const [showPatientName, setShowPatientName] = useState(true);
const [showPatientReference, setShowPatientReference] = useState(false);

// In header render:
<ToggleButtonGroup
  value={[
    ...(showSystemId ? ['systemId'] : []),
    ...(showPatientName ? ['patientName'] : []),
    ...(showPatientReference ? ['patientReference'] : [])
  ]}
  onChange={(event, newFormats) => {
    setShowSystemId(newFormats.includes('systemId'));
    setShowPatientName(newFormats.includes('patientName'));
    setShowPatientReference(newFormats.includes('patientReference'));
  }}
  aria-label="display options"
  size="small"
>
  <ToggleButton value="systemId" aria-label="show system id">
    <BadgeIcon />
  </ToggleButton>
  <ToggleButton value="patientName" aria-label="show patient name">
    <PersonIcon />
  </ToggleButton>
  <ToggleButton value="patientReference" aria-label="show patient reference">
    <CodeIcon />
  </ToggleButton>
</ToggleButtonGroup>
```

**Category/type filter** (adapt categories for the resource — use FHIR value sets):
```jsx
const [selectedCategory, setSelectedCategory] = useState('');

function handleCategoryChange(event){
  const value = event.target.value;
  setSelectedCategory(value);
  if(value){
    setSearchParams({ category: value });
  } else {
    setSearchParams({});
  }
}

// In header render:
<FormControl size="small" sx={{ minWidth: 180 }}>
  <InputLabel id="category-filter-label">Category</InputLabel>
  <Select
    labelId="category-filter-label"
    id="categoryFilter"
    value={selectedCategory}
    label="Category"
    onChange={handleCategoryChange}
  >
    <MenuItem value=""><em>All Categories</em></MenuItem>
    {/* Resource-specific categories from FHIR value sets */}
  </Select>
</FormControl>
```

#### Reference: Page Component Subscription Pattern

**CORRECT subscription routing** (autoSubscribe=true uses autopublish, false uses selectedPatient):
```javascript
// CORRECT subscription routing
const isLoading = useTracker(function(){
  let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
  // ... build query with patient filter and search filter ...

  if(autoSubscribeEnabled){
    const handle = Meteor.subscribe('autopublish.{ResourceTypes}', query, { limit: 1000 });
    return !handle.ready();
  } else {
    const handle = Meteor.subscribe('selectedPatient.{ResourceTypes}', Session.get('selectedPatientId'), { limit: 1000 });
    return !handle.ready();
  }
}, [Session.get('selectedPatientId'), searchFilter]);
```

**FhirNoData component** for empty state:
```jsx
import FhirNoData from '../components/FhirNoData.jsx';

// In render, when no data:
<FhirNoData
  resourceType="{ResourceType}"
  searchFilter={searchFilter}
  onAdd={handleAdd{ResourceType}}
/>
```

Pass visibility props to the table component:
```jsx
<{ResourceTypes}Table
  hideBarcode={!showSystemId}
  hideSubject={!showPatientName}
  hidePatientReference={!showPatientReference}
  order={sortOrder}
  // ... other existing props
/>
```

#### Reference: Test Patterns

**Row-finding by visible code** (not timestamp):
```javascript
// After search narrows results, find row by code value visible in table
browser.execute(function(codeValue) {
  const rows = document.querySelectorAll('#{resourceTypes}Table tbody tr');
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].textContent.includes(codeValue)) {
        rows[i].click();
        return { success: true, found: true };
      }
    }
    // Fallback: click first row
    rows[0].click();
    return { success: true, found: false };
  }
  return { success: false, found: false };
}, [testRecord.code]);
```

**Lock icon click before delete:**
```javascript
// Click Lock icon to enter edit mode (required before delete)
browser.execute(function() {
  const lockIcon = document.querySelector('button svg[data-testid="LockIcon"]');
  if (lockIcon) {
    lockIcon.closest('button').click();
    return true;
  }
  return false;
});
browser.pause(500);
```

**Delete button by icon data-testid:**
```javascript
// Find and click Delete button by its icon
browser.execute(function() {
  // Try icon-based approach first
  const deleteIcon = document.querySelector('button svg[data-testid="DeleteIcon"]');
  if (deleteIcon) {
    const btn = deleteIcon.closest('button');
    if (btn && !btn.disabled) {
      btn.click();
      return { clicked: true };
    }
  }
  // Fallback: find by button text
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.includes('Delete') && !button.disabled) {
      button.click();
      return { clicked: true };
    }
  }
  return { clicked: false };
});
```

**Search before row-click in delete test:**
```javascript
// Search to narrow results before finding row to delete
browser.execute(function(searchTerm) {
  const input = document.querySelector('#{resourceType}SearchInput');
  if (input) {
    input.value = searchTerm;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}, [testRecord.code]);
browser.pause(3000); // Wait for subscription filter
```

---

### Phase 4: Verify

After applying transformations:

1. **Review the changes** — summarize what was modified in each file
2. **Check for missing imports** — scan for any icons or components used but not imported
3. **Check for orphaned code** — look for the old `<CardActions>` section, old Edit/Cancel buttons, old barcode placement that should have been removed
4. **Suggest next steps:**

```
Polish complete for {ResourceType}!

Changes applied:
- {ResourceType}Detail.jsx: [list of changes]
- {ResourceTypes}Table.jsx: [list of changes]
- {ResourceTypes}Page.jsx: [list of changes]
- crud.{resourceTypes}.js: [list of changes]

Next steps:
1. Restart Meteor server
2. Navigate to /{resourceTypes} and verify the page
3. Open an existing record and verify header icons
4. Click Preview icon to test view switching
5. Click Lock to enter edit mode, verify Save/Cancel inline
6. Run tests: npm test -- tests/nightwatch/honeycomb/enable_autopublish/crud.{resourceTypes}.js
```

---

## Before / After Summary

| Aspect | OLD Pattern | NEW Pattern |
|--------|-------------|-------------|
| **Subscription (autoSubscribe)** | `selectedPatient.*` or `{resource}.all` | `autopublish.*` with query |
| **Subscription (production)** | `{resource}.all` | `selectedPatient.*` with patientId |
| **No-data state** | Varies (some use custom cards) | `<FhirNoData>` component |
| **Loading state** | Often missing | `isLoading` check returns null |
| **Barcode** | `<Box>` in CardContent body | CardHeader title |
| **Edit toggle** | Edit/Cancel buttons in CardActions | Lock/Unlock icon in header |
| **Delete** | In CardActions, always clickable | In header, gated on `isEditing` |
| **Save/Cancel** | CardActions at bottom | Inline in form with border-top |
| **View modes** | Read + Edit only | Read + Form-Edit + Preview |
| **URL params** | None | `?view=form` / `?view=page` |
| **CardActions** | Present | Removed entirely |
| **Header** | Static text title | Barcode title + icon action group |
| **Table notes** | Text in cell | DescriptionIcon |
| **Table actions** | Row click only | Preview + Edit icon buttons |
| **Page controls** | Varies | Sort toggle + column toggle + category filter |
| **Test row-find** | `textContent.includes(timestamp)` | `textContent.includes(code)` |
| **Test delete** | Direct click | Lock first, then click by icon |

## Golden Reference

The complete polished implementation lives in:
- `imports/ui-fhir/diagnosticReports/DiagnosticReportDetail.jsx`
- `imports/ui-fhir/diagnosticReports/DiagnosticReportsTable.jsx`
- `imports/ui-fhir/diagnosticReports/DiagnosticReportsPage.jsx`

When in doubt about any pattern, read the DiagnosticReports files — they are the source of truth for the polished UI.

## Related Commands

- `/create-crud-microservice {Resource}` — Generate new resource from scratch (unpolished)
- `/create-crud-tests {Resource}` — Generate CRUD test suite
- `/audit-theme` — Scan for hardcoded colors
- `/audit-id-lookups` — Scan for ID collision bugs
