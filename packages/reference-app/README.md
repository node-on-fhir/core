# Reference App Package

Gold standard reference template for Honeycomb packages - ONC HealthIT Certification

## Overview

This package serves as the definitive template for creating new Honeycomb packages. It demonstrates all available APIs, best practices, and patterns for building healthcare applications with FHIR resources.

## Features

- ✅ **ONC Health IT Certification Program Tracker** - Comprehensive dashboard for tracking all 63 ONC certification criteria
- ✅ Complete route injection system
- ✅ Sidebar workflow integration  
- ✅ Footer button management
- ✅ FHIR resource handling
- ✅ Dark theme support
- ✅ Meteor v3 async/await patterns
- ✅ Client-only collections for UI state
- ✅ Server methods with validation
- ✅ Publications with authorization
- ✅ Settings integration
- ✅ Environment variable support
- ✅ Responsive design for desktop and mobile
- ✅ Multi-Factor Authentication integration
- ✅ ONC compliance validation

## Package Structure

```
reference-app/
├── package.js           # Atmosphere.js manifest
├── index.jsx           # Main exports and API definitions
├── client/
│   ├── ReferenceAppPage.jsx      # Main page component
│   ├── FooterButtons.jsx         # Footer button component
│   └── ReferenceAppWorkflow.jsx  # Workflow component
├── server/
│   ├── index.js        # Server startup
│   ├── methods.js      # Meteor methods
│   └── publications.js # Data publications
├── lib/
│   ├── collections.js  # Collections and schemas
│   └── utilities.js    # Utility functions
├── configs/
│   └── settings.reference-app.json
└── data/
    └── sample-data.json
```

## API Reference

### Routes

```javascript
DynamicRoutes = [{
  name: 'RouteName',
  path: '/route-path',
  element: <Component />,
  requireAuth: true
}]
```

### Sidebar Integration

```javascript
SidebarWorkflows = [{
  primaryText: 'Display Name',
  to: '/route-path',
  iconName: 'icon-name'
}]

SidebarElements = [{
  primaryText: 'Resource Name',
  to: '/resource-path',
  iconName: 'icon-name',
  collectionName: 'CollectionName'
}]
```

### Footer Buttons

```javascript
FooterButtons = [{
  pathname: '/page-path',
  element: <FooterComponent />
}]
```

## Usage

### Adding to Your App

```bash
meteor add clinical:reference-app
```

### Running with Full ONC Certification Suite

To run with all ONC Health IT Certification packages for complete testing and development:

```bash
meteor run --settings packages/reference-app/configs/settings.reference-app.json --extra-packages "clinical:reference-app, clinical:order-catalog, clinical:drug-interactions, clinical:secure-messaging, clinical:request-for-corrections, clinical:ccda-export, clinical:implantable-devices, clinical:e-prescribing, clinical:quality-measures, clinical:hipaa-compliance, clinical:clinical-lists, clinical:drug-formulary, clinical:syndromic-surveillance, clinical:family-health-history, clinical:social-determinants, clinical:data-exporter, clinical:structured-data-capture, symptomatic:symptom-tracking, clinical:case-reporting, clinical:cancer-registry-reporting, clinical:lab-test-reporting, clinical:immunization-registry, clinical:antimicrobial-reporting, clinical:pacio-core, clinical:accounts-management, clinical:multi-factor-auth"
```

This command loads all certification-related packages to provide the complete ONC Health IT Certification Program Tracker experience with all 63 criteria implementations.

### Configuration

Add to your settings file:

```json
{
  "public": {
    "modules": {
      "referenceApp": {
        "enabled": true,
        "showInSidebar": true
      }
    }
  },
  "private": {
    "referenceApp": {
      "apiKey": "your-api-key",
      "endpoint": "https://api.example.com",
      "enableCronJobs": false,
      "initializeSampleData": false
    }
  }
}
```

### Environment Variables

```bash
export REFERENCE_APP_API_KEY=your-api-key
export REFERENCE_APP_ENDPOINT=https://api.example.com
```

## Creating a New Package

1. Copy this entire reference-app directory
2. Rename it to your package name
3. Update package.js with your package details
4. Modify index.jsx to export your routes and components
5. Update components with your functionality
6. Add your server methods and publications
7. Create your settings configuration

## Best Practices

### Meteor v3 Async Patterns

Always use async/await on the server:

```javascript
// Server-side
const Patients = await global.Collections.Patients;
const count = await Patients.countAsync();
const patient = await Patients.findOneAsync({id: patientId});
```

### Dark Theme Support

Use theme-aware colors:

```javascript
sx={{ 
  bgcolor: theme => theme.palette.mode === 'light' 
    ? theme.palette.grey[50]
    : theme.palette.background.default
}}
```

### Error Handling

Always include error handling:

```javascript
Meteor.call('method.name', data, (error, result) => {
  if (error) {
    console.error('Error:', error);
    // Handle error
  } else {
    // Process result
  }
});
```

## Testing

### Unit Tests

```javascript
// tests/reference-app-tests.js
import { ReferenceAppUtilities } from '../lib/utilities';

Tinytest.add('ReferenceApp - FHIR Resource Creation', function(test) {
  const resource = ReferenceAppUtilities.createFhirResource('Observation', {
    subject: { reference: 'Patient/123' },
    code: { text: 'Test' },
    value: '100'
  });
  
  test.equal(resource.resourceType, 'Observation');
  test.equal(resource.subject.reference, 'Patient/123');
});
```

### Integration Tests

See `/tests/nightwatch/` for E2E test examples.

## Support

For questions or issues, please refer to the main Honeycomb documentation or create an issue in the repository.

## License

See LICENSE file in the root directory.