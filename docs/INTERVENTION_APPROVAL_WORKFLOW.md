# Intervention Approval Workflow

This document describes the approval workflow for medical interventions that require authorization before proceeding.

## Overview

When an intervention step requires approval (e.g., an ultrasound examination in the kidney stone protocol), the system creates notifications for designated medical officers to review and approve the request.

## Workflow Steps

1. **User executes intervention** - Patient or care team member follows intervention steps
2. **Approval required** - When reaching a step that requires approval:
   - A `Communication` resource is created to track the approval request
   - A `ServiceRequest` resource is created as a notification for the Chief Medical Officer
   - User is redirected to an "Awaiting Approval" page
3. **Chief Medical Officer receives notification** - CMO sees pending approvals on `/interventions` page
4. **Review and decision** - CMO reviews the request and can:
   - Approve the intervention step
   - Deny the intervention step
   - Suggest an alternative approach
5. **Workflow continues** - Based on the decision, the intervention either proceeds or adjusts

## Configuration

### Setting the Chief Medical Officer

In your settings file (`configs/settings.honeycomb.localhost.json`), configure the Chief Medical Officer:

```json
{
  "public": {
    "pacio": {
      "chiefMedicalOfficer": {
        "reference": "Practitioner/chief-medical-officer",
        "display": "Dr. Sarah Johnson, Chief Medical Officer"
      }
    }
  }
}
```

### User Account Configuration

For a user to receive approval notifications, their account must have a `practitionerId` that matches the configured Chief Medical Officer:

1. Create a Practitioner resource with ID matching the reference in settings
2. Set the user's `practitionerId` field to match:

```javascript
// In the database or via method
Meteor.users.update(userId, {
  $set: {
    'practitionerId': 'chief-medical-officer'
  }
});
```

## Technical Implementation

### ServiceRequest Structure

When an approval is needed, a ServiceRequest is created with:

```javascript
{
  resourceType: 'ServiceRequest',
  status: 'active',
  intent: 'order',
  priority: 'urgent',
  category: [{
    coding: [{
      system: 'http://honeycomb.ai/servicerequest-categories',
      code: 'intervention-approval',
      display: 'Intervention Approval Request'
    }]
  }],
  code: {
    text: 'Review and approve: [Step Name]'
  },
  performer: [{
    reference: 'Practitioner/chief-medical-officer',
    display: 'Chief Medical Officer'
  }],
  // Links to related resources
  supportingInfo: [
    { reference: 'ServiceRequest/[parent-intervention-id]' },
    { reference: 'Communication/[approval-request-id]' }
  ]
}
```

### Subscription Pattern

The `/interventions` page subscribes to ServiceRequests filtered by the logged-in user's practitionerId:

```javascript
Meteor.subscribe('serviceRequests.byPractitioner');
```

This publication filters ServiceRequests where the user is listed as:
- `performer.reference`
- `requester.reference`
- `supportingInfo.reference`

### Approval Processing

When an approval decision is made:
1. The Communication status is updated to 'completed' (approved) or 'stopped' (denied)
2. The notification ServiceRequest is marked as 'completed'
3. The intervention workflow continues or adjusts based on the decision

## User Interface

### For Patients/Care Team Members
- See "Awaiting Approval" status when a step requires authorization
- Cannot proceed until approval is granted

### For Chief Medical Officer
- See pending approval requests at the top of `/interventions` page
- Yellow warning alerts indicate pending approvals
- Click "Review" to process each request
- View patient information and intervention context
- Make informed decisions with rationale

## Testing

To test the approval workflow:

1. Log in as a patient user
2. Start a kidney stone intervention
3. Complete steps until reaching "Ultrasound Examination"
4. Click "Complete Step" - you'll see "Awaiting Approval"
5. Log in as a user with the Chief Medical Officer practitionerId
6. Navigate to `/interventions`
7. See the pending approval request
8. Click "Review" to process the approval