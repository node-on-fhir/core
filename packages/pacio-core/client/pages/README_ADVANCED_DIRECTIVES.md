<!-- # Advance Healthcare Directives Page with Tabs

## Summary

The Advance Healthcare Directives page has been updated to include tabs for displaying related clinical data:

### Tab Structure:
1. **Documents & Preferences** (Tab 0) - Original advance healthcare directives functionality
   - Upload and view advanced directive documents
   - Manage care preferences
   - Emergency contacts
   - Quick reference information

2. **Allergies** (Tab 1) - AllergyIntolerancesPage component
   - Displays patient allergy information
   - Uses the existing AllergyIntolerancesPage from ui-fhir

3. **Conditions** (Tab 2) - ConditionsPage component
   - Shows patient conditions/diagnoses
   - Uses the existing ConditionsPage from ui-fhir

4. **Care Plans** (Tab 3) - CarePlansPage component
   - Displays patient care plans
   - Uses the existing CarePlansPage from ui-fhir

5. **Procedures** (Tab 4) - ProceduresPage component
   - Shows patient procedures
   - Uses the existing ProceduresPage from ui-fhir

## Implementation Details

### Files Modified:
- `/imports/ui-pacio/AdvancedDirectivesPage.jsx`

### Key Changes:
1. Added Material-UI Tabs and Tab components to imports
2. Imported the four page components (AllergyIntolerancesPage, CarePlansPage, ConditionsPage, ProceduresPage)
3. Added `tabValue` state to track the active tab
4. Added `handleTabChange` function to handle tab switching
5. Wrapped existing content in conditional render for tab 0
6. Added conditional renders for tabs 1-4 with the respective page components

### Code Pattern:
```jsx
// Tab navigation
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Documents & Preferences" />
  <Tab label="Allergies" />
  <Tab label="Conditions" />
  <Tab label="Care Plans" />
  <Tab label="Procedures" />
</Tabs>

// Tab panels
{tabValue === 0 && (
  // Original advance healthcare directives content
)}
{tabValue === 1 && (
  <Box sx={{ mt: 2 }}>
    <AllergyIntolerancesPage />
  </Box>
)}
// ... etc for other tabs
```

## Testing

To test the implementation:
1. Navigate to the Advance Healthcare Directives page
2. Verify all 5 tabs are visible
3. Click each tab to ensure the correct content displays
4. Each tab should maintain the patient context from Session

## Notes

- Each imported page component handles its own data fetching and subscriptions
- The patient context is maintained through Session variables
- The tab structure allows users to access related clinical information without leaving the advance healthcare directives context -->