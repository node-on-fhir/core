# /create-npm-workflow

Create a new NPM workflow package for Honeycomb EHR.

## Usage

```
/create-npm-workflow {WorkflowName}
```

**Example:**
```
/create-npm-workflow PatientTimeline
```

## What This Command Does

1. Creates `npmPackages/{workflow-name}/` directory with all required files
2. Generates properly configured package.json, workflow.json, client.js, server.js
3. Creates a starter React page component with Material-UI
4. Creates example Meteor methods with v3 async patterns

## Instructions for Claude

When the user runs `/create-npm-workflow {Name}`, create the following files:

### 1. Derive Names

From the input `{Name}` (e.g., "PatientTimeline"):
- `packageName`: kebab-case (e.g., "patient-timeline")
- `componentName`: PascalCase + "Page" (e.g., "PatientTimelinePage")
- `methodPrefix`: camelCase (e.g., "patientTimeline")
- `displayName`: Title Case with spaces (e.g., "Patient Timeline")

### 2. Create Files

Create these files in `npmPackages/{packageName}/`:

#### package.json
```json
{
  "name": "@node-on-fhir/{packageName}",
  "version": "0.1.0",
  "description": "{displayName} workflow for Honeycomb EHR",
  "main": "client.js",
  "exports": {
    ".": "./client.js",
    "./server": "./server.js",
    "./server/methods": "./server/methods.js",
    "./workflow": "./workflow.json"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@mui/icons-material": "^5.0.0"
  },
  "keywords": ["fhir", "healthcare", "honeycomb", "workflow"],
  "author": "Clinical Meteor",
  "license": "MIT"
}
```

#### workflow.json
```json
{
  "name": "{packageName}",
  "displayName": "{displayName}",
  "routes": [
    {
      "name": "{componentName}",
      "path": "/{packageName}",
      "component": "{componentName}",
      "requireAuth": false
    }
  ],
  "sidebarItems": [
    {
      "primaryText": "{displayName}",
      "to": "/{packageName}",
      "iconName": "Extension",
      "requireAuth": false
    }
  ]
}
```

#### client.js
```javascript
// npmPackages/{packageName}/client.js

import React from 'react';
import {componentName} from './client/{componentName}.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  switch (route.component) {
    case '{componentName}':
      element = <{componentName} />;
      break;
    default:
      console.warn(`[{packageName}] Unknown component: ${route.component}`);
  }
  return {
    name: route.name,
    path: route.path,
    element: element,
    requireAuth: route.requireAuth || false
  };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false
  };
});

export { DynamicRoutes, SidebarWorkflows, {componentName} };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};
```

#### server.js
```javascript
// npmPackages/{packageName}/server.js
export * from './server/methods.js';
```

#### server/methods.js
```javascript
// npmPackages/{packageName}/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  '{methodPrefix}.getData': async function(id) {
    check(id, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[{methodPrefix}.getData] Fetching:', id);

    // Replace with actual collection query
    // return await Collection.findOneAsync({ _id: id });
    return { id: id, timestamp: new Date().toISOString() };
  }
});

console.log('[{packageName}] Server methods registered');
```

#### client/{componentName}.jsx
```javascript
// npmPackages/{packageName}/client/{componentName}.jsx

import React from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';

function {componentName}() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }} id="{packageName}Page">
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          avatar={<ExtensionIcon />}
          title="{displayName}"
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText'
          }}
        />
        <CardContent>
          <Typography variant="body1" sx={{ color: 'text.primary' }}>
            {displayName} workflow page. Edit this component to add your functionality.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default {componentName};
```

#### README.md
```markdown
# @node-on-fhir/{packageName}

{displayName} workflow for Honeycomb EHR.

## Quick Start

\`\`\`bash
EXTRA_WORKFLOWS=@node-on-fhir/{packageName} meteor run --settings configs/settings.honeycomb.localhost.json
\`\`\`

Navigate to: http://localhost:3000/{packageName}

## Documentation

See `npmPackages/CLAUDE.md` for the NPM workflow package pattern.
```

### 3. Post-Creation Steps

After creating the files, remind the user to:

1. Run `npm install` to link the workspace package
2. Test with: `EXTRA_WORKFLOWS=@node-on-fhir/{packageName} meteor run --settings configs/settings.honeycomb.localhost.json`
3. Navigate to: `http://localhost:3000/{packageName}`

### 4. Output Summary

```
Created NPM workflow package: @node-on-fhir/{packageName}

Files created:
  npmPackages/{packageName}/package.json
  npmPackages/{packageName}/workflow.json
  npmPackages/{packageName}/client.js
  npmPackages/{packageName}/server.js
  npmPackages/{packageName}/server/methods.js
  npmPackages/{packageName}/client/{componentName}.jsx
  npmPackages/{packageName}/README.md

Next steps:
  1. npm install
  2. EXTRA_WORKFLOWS=@node-on-fhir/{packageName} meteor run --settings configs/settings.honeycomb.localhost.json
  3. Navigate to: http://localhost:3000/{packageName}
```

## Reference

- Pattern documentation: `npmPackages/CLAUDE.md`
- Example package: `npmPackages/example-workflow/`
- Pattern rules: `.claude/rules/npm-packages/migration-pattern.md`
