# clinical:patient-matching

FHIR Identity Matching and Patient Matching Implementation for Honeycomb

## Overview

This package implements the [Interoperable Digital Identity and Patient Matching FHIR Implementation Guide](https://build.fhir.org/ig/HL7/fhir-identity-matching-ig/) (v2.0.0-ballot) for secure, cross-organizational patient identity verification and matching. It provides comprehensive identity proofing, patient matching algorithms, and integration with multiple identity verification providers.

## Features

### Identity Verification
- **Multiple Identity Providers**: ID.me, Login.gov, CLEAR, Verato, Auth0, Onfido, Jumio
- **NIST 800-63-3 Compliance**: Support for IAL1, IAL2, and IAL3
- **Mock Provider**: Built-in mock provider for development and testing
- **Document Verification**: Government ID and document validation
- **Biometric Support**: Face matching and liveness detection (IAL3)

### Patient Matching
- **$IDI-match Operation**: Enhanced FHIR $match operation for cross-organizational matching
- **Probabilistic Matching**: Weighted algorithm with configurable thresholds
- **Identity Assurance Levels**: IDIAL1, IDIAL1.5, IDIAL1.8, and IDIAL2
- **Digital Identifiers**: UUID v4 generation and management
- **Consumer vs B2B Matching**: Different confidence thresholds for different use cases
- **Audit Logging**: Complete audit trail for all operations

## Installation

```bash
meteor add clinical:patient-matching
```

## Quick Start

### Development Mode (Mock Provider)

```bash
# Run with mock identity verification enabled
meteor run --settings packages/patient-matching/configs/settings.patient-matching.json
```

### Basic Usage

```javascript
// Server-side: Perform patient match
const matchResult = await Meteor.callAsync('PatientMatching.idiMatch', {
  patient: {
    name: [{ given: ['John'], family: 'Doe' }],
    birthDate: '1980-01-15',
    gender: 'male'
  },
  maxResults: 10
});

// Client-side: React components
import { PatientMatchingPage } from 'meteor/clinical:patient-matching/client/pages/PatientMatchingPage';
import { IdentityAssurancePage } from 'meteor/clinical:patient-matching/client/pages/IdentityAssurancePage';

// Add to your routes
const routes = [
  { path: '/patient-matching', element: <PatientMatchingPage /> },
  { path: '/identity-assurance/:patientId', element: <IdentityAssurancePage /> }
];
```

## Configuration

### Identity Providers

Configure identity providers in your settings file:

```json
{
  "private": {
    "identityProviders": {
      "mock": {
        "enabled": true,
        "autoApprove": true
      },
      "idme": {
        "enabled": false,
        "clientId": "YOUR_CLIENT_ID",
        "clientSecret": "YOUR_SECRET",
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

See `configs/settings.patient-matching.json` for complete configuration options.

### Patient Matching Configuration

```json
{
  "private": {
    "patientMatching": {
      "thresholds": {
        "certain": 0.95,    // 95%+ confidence
        "probable": 0.80,   // 80-94% confidence
        "possible": 0.60    // 60-79% confidence
      },
      "weights": {
        "identifier": 0.35,
        "name": 0.25,
        "birthDate": 0.20,
        "gender": 0.05,
        "address": 0.10,
        "telecom": 0.05
      }
    }
  }
}
```

## Identity Assurance Levels

### NIST 800-63-3 Levels

- **IAL1**: Self-asserted identity (email/phone verification)
- **IAL2**: Remote identity proofing (government ID + address verification)
- **IAL3**: In-person identity proofing with biometric verification

### FHIR IDI Assurance Levels

- **IDIAL1**: Basic identity verification
- **IDIAL1.5**: Enhanced verification with additional attributes
- **IDIAL1.8**: High assurance (minimum for consumer PHI access)
- **IDIAL2**: Highest assurance with comprehensive verification

## API Reference

### Meteor Methods

#### `PatientMatching.idiMatch`
Performs cross-organizational patient matching using the $IDI-match operation.

```javascript
const result = await Meteor.callAsync('PatientMatching.idiMatch', {
  patient: patientResource,    // FHIR Patient resource or partial
  onlyCertainMatches: false,   // Only return 95%+ matches
  maxResults: 10               // Maximum number of results
});
```

#### `PatientMatching.startIdentityVerification`
Initiates identity verification flow with external provider.

```javascript
const session = await Meteor.callAsync('PatientMatching.startIdentityVerification', {
  patientId: 'patient-123',
  requiredIAL: 'IAL2',
  provider: 'idme'  // or 'mock' for development
});
```

#### `PatientMatching.getVerificationStatus`
Gets current identity verification status for a patient.

```javascript
const status = await Meteor.callAsync('PatientMatching.getVerificationStatus', 'patient-123');
// Returns: { currentIAL, verifiedIdentifiers, lastVerified }
```

### React Components

#### `<PatientMatchingPage />`
Main patient matching interface with search form and results display.

Props:
- `onMatch`: Callback function when matches are found
- `requiredIAL`: Minimum identity assurance level required

#### `<IdentityAssurancePage />`
Step-by-step identity verification wizard.

Props:
- `patientId`: ID of patient to verify (or null to select)
- `onComplete`: Callback when verification completes
- `targetIAL`: Target assurance level (default: IAL2)

#### `<MatchResultsTable />`
Displays patient match results with confidence scores.

Props:
- `matches`: Array of match results
- `onSelectMatch`: Callback when match is selected
- `showScores`: Show confidence percentages (default: true)

## Security Considerations

### Authentication Requirements
- All digital identifier operations require AAL2 authentication
- Identity verification sessions expire after 30 minutes
- Audit logs track all matching and verification operations

### Data Protection
- SSNs are masked in logs and displays (only last 4 shown)
- Biometric data is never stored (only match results)
- Patient data encryption available for high-security deployments

### Production Checklist
1. Disable mock provider: `"mock": { "enabled": false }`
2. Enable encryption: `"encryptPatientData": true`
3. Configure allowed origins for CORS
4. Use environment variables for API keys
5. Enable audit log retention policies

## Testing

### Unit Tests

```bash
# Run package tests
meteor test-packages ./packages/patient-matching
```

### Test Scenarios

With mock provider enabled:

1. **Basic Search**: Test name + birthdate matching
2. **IAL1 Verification**: Email/phone verification flow
3. **IAL2 Verification**: Document upload simulation
4. **IAL3 Verification**: Biometric verification simulation

### Test Data

The package includes test patients with various identity levels:
- `test-ial1`: Basic verified identity
- `test-ial2`: Government ID verified
- `test-ial3`: Biometric verified

## Troubleshooting

### Common Issues

1. **"No match service URL configured"**
   - Normal for local development
   - External matching service is optional

2. **"Identity provider not enabled"**
   - Check provider is enabled in settings
   - Verify credentials are configured

3. **"Patient not found" errors**
   - Ensure patient exists in database
   - Check patient ID format

4. **Session expiration**
   - Identity sessions expire after 30 minutes
   - User must restart verification process

### Debug Mode

Enable verbose logging:
```json
{
  "development": {
    "verboseLogging": true,
    "logApiCalls": true
  }
}
```

## Integration Examples

### SMART on FHIR

```javascript
// Launch context with patient matching
const context = {
  patient: matchResult.entry[0].resource.id,
  identityAssurance: matchResult.entry[0].resource.meta.security[0].code,
  matchConfidence: matchResult.entry[0].search.score
};
```

### Consent Management

```javascript
// Require identity verification before consent
if (patient.identityAssurance < 'IDIAL1.8') {
  // Redirect to identity verification
  return <IdentityAssurancePage 
    patientId={patient.id} 
    targetIAL="IAL2" 
  />;
}
```

## Support

- **Package Issues**: https://github.com/clinical-meteor/patient-matching
- **ID.me Support**: https://help.id.me/hc/en-us
- **Login.gov Support**: https://developers.login.gov/support/
- **FHIR IG Questions**: https://chat.fhir.org/#narrow/stream/patient-matching

## License

MIT