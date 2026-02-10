# NPM Workflow Package Pattern

## Overview

NPM workflow packages replace Atmosphere.js packages for clinical workflow modules. This pattern enables plugin-style architecture using standard NPM tooling.

## Standard File Structure

```
npmPackages/{package-name}/
├── package.json           # @node-on-fhir/{name}
├── client.js              # Client entry (exports DynamicRoutes, SidebarWorkflows)
├── server.js              # Server entry (re-exports methods)
├── server/
│   └── methods.js         # Meteor methods (async pattern)
├── workflow.json          # Route and sidebar configuration
├── README.md              # Package documentation
└── client/
    └── {Page}.jsx         # React page components
```

## Export Contract

### client.js Must Export

```javascript
// Named exports
export { DynamicRoutes, SidebarWorkflows, PageComponent };

// Default export (for WorkflowRegistry)
export default {
  name: 'workflow-name',
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};
```

### DynamicRoutes Format

```javascript
const DynamicRoutes = [
  {
    name: 'PageName',
    path: '/url-path',
    element: <PageComponent />,
    requireAuth: false
  }
];
```

### SidebarWorkflows Format

```javascript
const SidebarWorkflows = [
  {
    primaryText: 'Display Text',
    to: '/url-path',
    iconName: 'IconName',  // From @mui/icons-material
    requireAuth: false
  }
];
```

## Server Method Patterns

### Meteor v3 Async Required

```javascript
// ❌ WRONG - Synchronous (Meteor v2)
Meteor.methods({
  'myWorkflow.getData': function(id) {
    return Collection.findOne({ _id: id });  // Sync method
  }
});

// ✅ CORRECT - Async (Meteor v3)
Meteor.methods({
  'myWorkflow.getData': async function(id) {
    check(id, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    return await Collection.findOneAsync({ _id: id });
  }
});
```

### Use function() Not Arrow Functions

```javascript
// ❌ WRONG - Arrow function (no 'this' context)
'myWorkflow.getData': async (id) => {
  if (!this.userId) { /* 'this' is undefined */ }
}

// ✅ CORRECT - function syntax (has 'this' context)
'myWorkflow.getData': async function(id) {
  if (!this.userId) { /* 'this' works */ }
}
```

### Console Logging Standard

```javascript
// Always prefix with [packageName]
console.log('[myWorkflow.getData] Fetching:', id);
console.error('[myWorkflow] Error:', error);
```

## Theme Compliance

### Use Theme Tokens

```javascript
// ❌ WRONG - Hardcoded colors
<Box sx={{ backgroundColor: '#ffffff', color: '#000000' }} />
<Card sx={{ bgcolor: 'white' }} />

// ✅ CORRECT - Theme tokens
<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }} />
<Card sx={{ bgcolor: 'background.paper' }} />
```

### Common Theme Tokens

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `background.paper` | #ffffff | #1e1e1e |
| `background.default` | #f6f6f6 | #121212 |
| `text.primary` | rgba(0,0,0,0.87) | #ffffff |
| `text.secondary` | rgba(0,0,0,0.54) | rgba(255,255,255,0.7) |
| `divider` | rgba(0,0,0,0.12) | rgba(255,255,255,0.12) |

## Patient Context Handling

### For Patient-Scoped Workflows

```javascript
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

function PatientScopedPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);
  const patientId = useTracker(() => Session.get('selectedPatientId'), []);

  // Always check for patient context
  if (!patient) {
    return (
      <Container>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  // Continue with patient data...
}
```

### Session Keys

- `Session.get('selectedPatient')` - Full patient object
- `Session.get('selectedPatientId')` - FHIR id string

## Peer Dependencies

Always use peer dependencies for shared libraries:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0"
  }
}
```

**Why**: These are already in the main app. Using peerDependencies prevents duplicate installations.

## workflow.json Schema

```json
{
  "name": "workflow-name",
  "displayName": "Human Readable Name",
  "routes": [
    {
      "name": "RouteName",
      "path": "/url-path",
      "component": "ComponentName",
      "requireAuth": false
    }
  ],
  "sidebarItems": [
    {
      "primaryText": "Sidebar Text",
      "to": "/url-path",
      "iconName": "MuiIconName",
      "requireAuth": false
    }
  ]
}
```

## Component Mapping in client.js

```javascript
import MyPage from './client/MyPage.jsx';
import OtherPage from './client/OtherPage.jsx';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;

  // Map component name to actual component
  switch (route.component) {
    case 'MyPage':
      element = <MyPage />;
      break;
    case 'OtherPage':
      element = <OtherPage />;
      break;
    default:
      console.warn(`[workflow] Unknown component: ${route.component}`);
  }

  return {
    name: route.name,
    path: route.path,
    element: element,
    requireAuth: route.requireAuth || false
  };
});
```

## Running with EXTRA_WORKFLOWS

```bash
# Development
EXTRA_WORKFLOWS=@node-on-fhir/my-workflow meteor run --settings configs/settings.honeycomb.localhost.json

# Multiple packages
EXTRA_WORKFLOWS=@node-on-fhir/pkg1,@node-on-fhir/pkg2 meteor run --settings ...
```

## Anti-Patterns to Avoid

### 1. Hardcoded Colors
```javascript
// ❌ WRONG
<Box sx={{ color: '#333', backgroundColor: 'white' }} />
```

### 2. Synchronous Meteor Methods
```javascript
// ❌ WRONG
const record = Collection.findOne({ _id: id });
```

### 3. Missing Patient Context Check
```javascript
// ❌ WRONG - No patient check for patient-scoped data
const observations = useTracker(() => {
  return Observations.find({}).fetch();  // Returns all patients' data!
}, []);
```

### 4. Arrow Functions in Meteor Methods
```javascript
// ❌ WRONG - 'this' context lost
'method.name': async (data) => { ... }
```

### 5. Direct Dependencies for Shared Libraries
```json
// ❌ WRONG - Will duplicate React
{
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

## Related

- Main documentation: `npmPackages/CLAUDE.md`
- Example package: `npmPackages/example-workflow/`
- Scaffold command: `.claude/commands/create-npm-workflow.md`
- WorkflowRegistry: `imports/lib/WorkflowRegistry.js`
- Theme rules: `.claude/rules/ui/theming.md`
- Meteor v3 async: `.claude/rules/meteor/v3-async.md`
