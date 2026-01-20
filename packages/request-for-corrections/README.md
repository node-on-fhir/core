# packages/request-for-corrections/README.md

# FHIR Patient Correction Request Package

This package implements the [HL7 FHIR Patient Request for Corrections Implementation Guide](http://hl7.org/fhir/uv/patient-corrections/), providing a standardized electronic process for patients to request corrections to errors in their medical records.

## Overview

The Request for Corrections package enables:
- Patients to submit correction requests electronically
- Healthcare providers to review and process correction requests
- Bidirectional communication between patients and providers
- Workflow tracking of correction request status
- Support for disagreement logging when corrections are denied

## Key Features

- **FHIR R4 Compliant**: Implements profiles for Communication, Task, and Bundle resources
- **Complete Workflow Management**: Tracks requests through multiple states (queued, in-review, accepted, denied, etc.)
- **HIPAA & GDPR Compliant**: Supports regulatory requirements for patient record corrections
- **Real-time Communication**: Enables back-and-forth messaging between patients and providers
- **Audit Trail**: Complete tracking of all request activities

## FHIR Resources

### Profiles
- **PatientCorrectionBundle**: Container for submitting correction requests
- **PatientCorrectionCommunication**: Messages in the correction conversation
- **PatientCorrectionTask**: Workflow tracking for correction requests

### Code Systems
- **PatientCorrectionCommunicationTypes**: Types of communications (correction request, disagreement)
- **PatientCorrectionTaskTypes**: Types of tasks (correction request, disagreement)
- **PatientCorrectionBusinessStatus**: Detailed workflow states

### Operations
- **$correction-request**: Custom operation for submitting correction requests

## Installation

Add the package to your Meteor app:

```bash
meteor add clinical:request-for-corrections
```

## Configuration

Add to your settings file:

```json
{
  "public": {
    "requestForCorrections": {
      "enableNotifications": true,
      "defaultReviewTimeoutDays": 30
    }
  },
  "private": {
    "requestForCorrections": {
      "autoAssignReviewers": false,
      "requireApprovalForAmendments": true
    }
  }
}
```

## Usage

### Client-Side Routes

The package exports routes that can be imported into your main app:

```javascript
import { DynamicRoutes } from 'meteor/clinical:request-for-corrections';
```

Available routes:
- `/correction-requests` - Main dashboard
- `/correction-requests/new` - Create new request
- `/correction-requests/:id` - View/manage specific request

### API Examples

#### Submit a Correction Request

```javascript
import { Meteor } from 'meteor/meteor';

const correctionBundle = {
  resourceType: "Bundle",
  type: "collection",
  entry: [{
    resource: {
      resourceType: "Communication",
      status: "completed",
      category: [{
        coding: [{
          system: "http://hl7.org/fhir/uv/patient-corrections/CodeSystem/PatientCorrectionCommunicationTypes",
          code: "medRecCxReq"
        }]
      }],
      subject: { reference: "Patient/123" },
      sender: { reference: "Patient/123" },
      recipient: [{ reference: "Organization/hospital" }],
      payload: [{
        contentString: "Please correct my date of birth from 1980-01-01 to 1981-01-01"
      }]
    }
  }]
};

Meteor.call('correctionRequest.submit', correctionBundle, (error, result) => {
  if (error) {
    console.error('Error submitting correction request:', error);
  } else {
    console.log('Correction request submitted:', result);
  }
});
```

#### Track Request Status

```javascript
import { CorrectionTasks } from 'meteor/clinical:request-for-corrections';

// Subscribe to correction tasks
const handle = Meteor.subscribe('correctionTasks.forPatient', patientId);

// Get current tasks
const activeTasks = CorrectionTasks.find({
  'subject.reference': `Patient/${patientId}`,
  status: { $in: ['ready', 'in-progress'] }
}).fetch();
```

## Workflow States

The correction request workflow follows these states:

1. **Submitted** (ready/queued): Request received, awaiting review
2. **Under Review** (in-progress/in-review): Provider reviewing request
3. **Additional Info Needed** (in-progress/waiting-for-information): Provider needs clarification
4. **Decision Made**:
   - **Accepted** (in-progress/accepted): Correction will be made
   - **Partially Accepted** (in-progress/partial-accept): Some corrections accepted
   - **Denied** (completed/denied): Request rejected
5. **Amendment Complete** (completed/amendment-completed): Changes applied to record
6. **Disagreement** (completed/disagreement-logged): Patient disagrees with denial

## Security Considerations

- All communications are encrypted using TLS 1.2+
- Supports SMART App Launch for authentication
- Audit logging for all correction request activities
- Role-based access control for provider actions

## Testing

Run package tests:

```bash
meteor test-packages clinical:request-for-corrections
```

## Contributing

This package follows the Honeycomb contribution guidelines. Please ensure:
- All FHIR resources comply with the Patient Corrections IG
- Tests are included for new functionality
- Documentation is updated for API changes

## License

MIT License

## References

- [HL7 FHIR Patient Corrections IG](http://hl7.org/fhir/uv/patient-corrections/)
- [FHIR R4 Specification](http://hl7.org/fhir/R4/)
- [HIPAA Right of Amendment](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/access/index.html)