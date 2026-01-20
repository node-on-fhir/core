# clinical:consent-generator

A development utility for creating FHIR Consent records and Access Control Lists (ACLs) in Honeycomb.

## ⚠️ DEVELOPMENT ONLY

This package is intended for development and testing purposes only. Remove it before deploying to production.

## Features

- Web interface for creating Consent records
- Pre-built templates for common consent scenarios
- Support for both FHIR Consent resources and ConsentAcls collection
- Role-based access control configuration
- Batch consent generation for testing

## Usage

1. Add the package to your project:
```bash
meteor add clinical:consent-generator
```

2. Navigate to `/consent-generator` in your browser

3. Use the interface to:
   - Create individual consent records
   - Generate consent records from templates
   - Configure role-based access controls
   - Test different consent scenarios

## Consent Templates

The package includes templates for:

- **Patient Access**: Patient accessing their own records
- **Provider Access**: Healthcare provider accessing patient records
- **System Access**: System-level access for backend operations
- **Citizen Access**: Public directory access
- **Emergency Access**: Break-glass emergency access
- **Research Access**: De-identified data for research
- **Family Access**: Family member proxy access

## API

### Server Methods

```javascript
// Create a single consent
Meteor.call('consents.generate', {
  template: 'patient-access',
  patientId: 'patient-123',
  role: 'PAT'
});

// Generate batch consents
Meteor.call('consents.generateBatch', {
  count: 10,
  template: 'provider-access'
});

// Clear all consents (BE CAREFUL!)
Meteor.call('consents.clearAll');
```

## Security Note

This package includes methods that can create and delete consent records without authentication checks. Only use in development environments.

## Future Enhancements

- Support for FHIR Permission resources (when available)
- More granular resource-level permissions
- Consent expiration testing
- Audit trail generation