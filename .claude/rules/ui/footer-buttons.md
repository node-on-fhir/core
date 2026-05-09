# Footer Button Traceability

## The Problem

Footer buttons are injected dynamically by multiple packages (Atmosphere and NPM workflow packages) via `WorkflowRegistry`. Without IDs or classNames, there's no way to trace a button back to its source package using browser DevTools.

## Naming Convention

### Button ID

```
{packageName}-{buttonLabel}-footer-btn
```

- `packageName`: kebab-case NPM package name (e.g., `radiology-workflow`, `fhir-graph`, `fhircast`)
- `buttonLabel`: kebab-case label derived from the button text (e.g., `order-catalog`, `subscribe`)
- Suffix: `footer-btn` to distinguish from other button types

### Box className

```
footer-buttons-{packageName}
```

Applied to the outer `<Box>` container to identify which package injected the group.

## Required Attributes

Every footer button component must have:

1. **`className` on the outer Box** — identifies the source package
2. **`id` on every Button** — identifies the specific button and its source

## Implementation Pattern

```jsx
function MyFooterButtons() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box className="footer-buttons-my-package" sx={{...}}>
      {footerRoutes.map(function(route) {
        return (
          <Button
            key={route.path}
            id={'my-package-' + route.label.toLowerCase().replace(/\s+/g, '-') + '-footer-btn'}
            variant={isActive ? 'contained' : 'text'}
            onClick={function() { navigate(route.path); }}
          >
            {route.label}
          </Button>
        );
      })}
    </Box>
  );
}
```

The ID generation inline expression:
```javascript
id={'my-package-' + route.label.toLowerCase().replace(/\s+/g, '-') + '-footer-btn'}
```

## How Footer.jsx Discovers Buttons

1. **Atmosphere packages**: Register footer components via package exports
2. **NPM workflow packages**: Register via `WorkflowRegistry` in `client.js`, which includes `footerButtons` in the route config
3. **Footer.jsx** collects all registered footer button components and renders them in the footer bar

## Tracing a Button to Its Source

In browser DevTools:

1. **Find all footer buttons**: `document.querySelectorAll('[id$="footer-btn"]')`
2. **Find buttons from a specific package**: `document.querySelectorAll('.footer-buttons-radiology-workflow button')`
3. **Inspect a specific button**: The `id` prefix tells you the package name

## Existing Components

### NPM Workflow Packages (`npmPackages/`)

| Component | Package | className | Example Button IDs |
|-----------|---------|-----------|-------------------|
| `PatientDirectoryFooterButtons.jsx` | radiology-workflow | `footer-buttons-radiology-workflow` | `radiology-workflow-order-catalog-footer-btn` |
| `PatientViewFooterButtons.jsx` | radiology-workflow | `footer-buttons-radiology-workflow` | `radiology-workflow-patient-chart-footer-btn`, `radiology-workflow-ips-footer-btn` |
| `RadiologyToolsFooterButtons.jsx` | radiology-workflow | `footer-buttons-radiology-workflow` | `radiology-workflow-checklists-footer-btn` |
| `PacioExamRoomFooterButtons.jsx` | radiology-workflow | `footer-buttons-radiology-workflow` | `radiology-workflow-radiology-dashboard-footer-btn` |
| `OrderHistoryFooterButtons.jsx` | radiology-workflow | `footer-buttons-radiology-workflow` | `radiology-workflow-radiology-worklist-footer-btn` |
| `FhircastNavButtons.jsx` | fhircast | `footer-buttons-fhircast` | `fhircast-config-footer-btn`, `fhircast-subscribe-footer-btn` |
| `LunarGraphFooterButtons.jsx` | fhir-graph | `footer-buttons-fhir-graph` | `fhir-graph-collections-footer-btn`, `fhir-graph-simulation-footer-btn` |

### Atmosphere Packages (`packages/`)

| Component | Package | className | Example Button IDs |
|-----------|---------|-----------|-------------------|
| `FooterButtons.jsx` | international-patient-summary | `footer-buttons-international-patient-summary` | `international-patient-summary-export-ips-footer-btn` |
| `FooterButtons.jsx` | reference-app | `footer-buttons-reference-app` | `reference-app-cancel-footer-btn`, `reference-app-save-footer-btn` |
| `FooterButtons.jsx` | provider-directory | `footer-buttons-provider-directory` | `provider-directory-new-organization-footer-btn`, etc. (25+ button groups) |
| `FooterButtons.jsx` | timelines | `footer-buttons-timelines` | `timelines-index-footer-btn`, `timelines-questionnaires-footer-btn` |
| `FooterButtons.jsx` | leaderboard-starter | `footer-buttons-leaderboard-starter` | `leaderboard-starter-click-footer-btn` |
| `FooterButtons.jsx` | patient-chart-starter | `footer-buttons-patient-chart-starter` | `patient-chart-starter-click-footer-btn` |
| `FooterButtons.jsx` | genome-central-redux | `footer-buttons-genome-central-redux` | `genome-central-redux-click-footer-btn` |

### Core UI (`imports/`)

| Component | Location | className | Example Button IDs |
|-----------|----------|-----------|-------------------|
| `CarePlanDesignerFooterButtons.jsx` | `imports/ui-fhir/carePlans/` | `footer-buttons-care-plan-designer` | `care-plan-designer-create-careplan-footer-btn` |
| `FooterButtons.jsx` | `imports/ui-vault-server/` | `footer-buttons-vault-server` | `vault-server-preferences-footer-btn` |

## Related

- File: `imports/ui/Footer.jsx` — Footer component that renders button groups
- File: `imports/lib/WorkflowRegistry.js` — NPM workflow registration
- Rule: `rules/ui/material-ui.md` — MUI component patterns
