# PACIO Core Package

PACIO-compliant EHR functionality for the Honeycomb FHIR platform.

## Overview

The `clinical:pacio-core` package extends Honeycomb with enhanced support for:
- Advance Directives with PDF viewing and watermarking
- Transition of Care documents
- Enhanced Goals with target tracking and achievement indicators
- Medication Lists
- Nutrition Orders
- Patient record synchronization

## Installation

```bash
meteor add clinical:pacio-core
```

## Features

### Advance Directives
- View and manage advance directive documents
- Status filtering (Current/Superseded/Revoked)
- PDF viewing with watermarking for revoked documents
- Revocation workflow with reason tracking

### Transition of Care
- Display and manage transition of care documents
- Section-based document viewing
- Support for C-CDA document types

### Enhanced Goals
- Target display with progress tracking
- Achievement status indicators
- Dashboard view for goal management

### Patient Sync
- Synchronize patient records from FHIR server
- Selective resource type syncing
- Progress tracking and error handling

## Usage

### Routes

The package adds the following routes:

```javascript
/patient/:id/advance-directives
/advance-directive/:id
/patient/:id/transition-of-care
/transition-of-care/:id
/patient/:id/goals
/patient/:id/medication-lists
/patient/:id/nutrition-orders
/pdf/:binaryId
```

### Components

#### Advance Directives
```javascript
import { AdvanceDirectiveCard } from 'meteor/clinical:pacio-core';
import { AdvanceDirectiveStatusFilter } from 'meteor/clinical:pacio-core';

<AdvanceDirectiveCard 
  advanceDirective={directive}
  onClick={handleClick}
/>

<AdvanceDirectiveStatusFilter
  value={statusFilter}
  onChange={handleFilterChange}
  showCounts={true}
/>
```

#### Goals
```javascript
import { GoalTargetDisplay, GoalAchievementIndicator } from 'meteor/clinical:pacio-core';

<GoalTargetDisplay
  targets={goal.target}
  showProgress={true}
/>

<GoalAchievementIndicator
  achievementStatus={goal.achievementStatus}
  lifecycleStatus={goal.lifecycleStatus}
  variant="detailed"
/>
```

#### Patient Sync
```javascript
import { PatientSyncButton } from 'meteor/clinical:pacio-core';

<PatientSyncButton
  patientId={patientId}
  resourceTypes={['DocumentReference', 'Goal']}
  onSuccess={handleSuccess}
/>
```

### Hooks

```javascript
import { useAdvanceDirectives, useAdvanceDirectiveOperations } from 'meteor/clinical:pacio-core';

// Get advance directives for a patient
const { advanceDirectives, loading, counts } = useAdvanceDirectives({
  patientId: 'patient-123',
  includeRevoked: false
});

// Operations
const { revokeDirective, createDirective } = useAdvanceDirectiveOperations();

revokeDirective(directiveId, reason, (error, result) => {
  if (!error) {
    console.log('Directive revoked');
  }
});
```

### Methods

```javascript
// Sync patient record
Meteor.call('pacio.syncPatientRecord', patientId, resourceTypes, callback);

// Revoke advance directive
Meteor.call('pacio.revokeAdvanceDirective', directiveId, reason, callback);

// Generate watermarked PDF
Meteor.call('pacio.generateWatermarkedPdf', pdfUrl, options, callback);
```

## Configuration

Add to your settings.json:

```json
{
  "public": {
    "modules": {
      "fhir": {
        "AdvanceDirectives": {
          "enabled": true,
          "allowRevoke": true,
          "watermarkRevoked": true
        },
        "TransitionOfCare": {
          "enabled": true
        },
        "EnhancedGoals": {
          "enabled": true,
          "showTargets": true,
          "showAchievements": true
        }
      },
      "pacio": {
        "pdfViewer": {
          "enablePrint": false,
          "enableDownload": true
        },
        "sync": {
          "autoSync": false,
          "syncInterval": 300000
        }
      }
    }
  },
  "private": {
    "google": {
      "mapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
    }
  }
}
```

### Google Maps Integration

The PACIO Core package now includes Google Maps integration for facility location visualization. To enable this feature:

1. Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Add the API key to your settings file under `private.google.mapsApiKey`
3. Alternatively, set the `GOOGLE_MAPS_API_KEY` environment variable

The map will automatically fall back to a static Mapbox image if no API key is configured.

## Development

### Package Structure
```
packages/pacio-core/
├── client/
│   ├── components/
│   ├── pages/
│   └── hooks/
├── lib/
│   ├── collections/
│   └── utilities/
├── server/
│   ├── methods/
│   └── publications/
├── package.js
└── index.jsx
```

### Testing

```bash
meteor test-packages ./packages/pacio-core
```

## License

See LICENSE file in the root directory.