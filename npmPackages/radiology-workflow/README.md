# @node-on-fhir/radiology-workflow

Inpatient radiology workflow module for Honeycomb EHR. Implements the complete imaging lifecycle from order entry through diagnostic reporting.

## Overview

This package provides a multi-user workflow for radiology departments with role-based dashboards:

| Actor | Dashboard | Phase | FHIR Resources |
|-------|-----------|-------|----------------|
| **Nurse** | `/radiology/nursing` | Order Entry | ServiceRequest |
| **Rad Tech** | `/radiology/tech` | Safety & Acquisition | Questionnaire, QuestionnaireResponse, Procedure, ImagingStudy |
| **Radiologist** | `/radiology/reading` | Interpretation & Reporting | Observation, RiskAssessment, DiagnosticReport |

## Installation

### Enable with EXTRA_WORKFLOWS

```bash
EXTRA_WORKFLOWS=@node-on-fhir/radiology-workflow meteor run --settings configs/settings.honeycomb.localhost.json
```

### NPM Link (for development)

```bash
cd /path/to/honeycomb-ehr
npm install
# The package is automatically linked via workspaces
```

## Workflow Phases

### Phase 1: Order Entry (Nurse)

1. Select patient from sidebar
2. Navigate to `/radiology/nursing`
3. Click "New Order"
4. Select modality (CT, MRI, X-ray, etc.)
5. Set priority and clinical indication
6. Submit order (creates ServiceRequest)

### Phase 2: Safety Screening (Tech)

1. Navigate to `/radiology/tech`
2. Select order from worklist (sorted by priority)
3. Complete safety questionnaire
4. System evaluates for contraindications
5. Proceed to acquisition

### Phase 3: Image Acquisition (Tech)

1. Click "Start Procedure" (creates Procedure)
2. Acquire images on modality
3. Upload via `/dicom/upload` (if needed)
4. Click "Complete Procedure" (creates ImagingStudy, marks ServiceRequest complete)

### Phase 4-7: Reading & Reporting (Radiologist)

1. Navigate to `/radiology/reading`
2. Select study from worklist
3. Open in DICOM viewer (`/dicom/viewer/:studyId`)
4. Add findings (creates Observations)
5. Add risk assessment if needed (creates RiskAssessment)
6. Write impression and sign report (creates DiagnosticReport)

## Collection Hooks

The package registers `.after()` hooks for workflow automation:

| Collection | Trigger | Action |
|------------|---------|--------|
| ServiceRequests | insert | Log new imaging order, update tech worklist |
| QuestionnaireResponses | insert | Evaluate contraindications, flag if issues |
| ImagingStudies | insert | Notify radiologist worklist |
| DiagnosticReports | insert | Link to Procedure, calculate turnaround time |
| Procedures | update (status) | Audit state transitions |

## User Role Detection

Roles are determined from `PractitionerRole.code`:

```javascript
import { useRadiologyRole } from '@node-on-fhir/radiology-workflow/client/hooks/useRadiologyRole';

function MyComponent() {
  const { role, isLoading } = useRadiologyRole();
  // role: 'nurse' | 'tech' | 'radiologist' | null
}
```

### Role Mappings

| PractitionerRole.code | Radiology Role |
|-----------------------|----------------|
| `RN`, `nurse`, `LPN`, `NP` | nurse |
| `RAD_TECH`, `technologist`, `radiographer` | tech |
| `RAD`, `radiologist`, `physician`, `MD` | radiologist |

## FHIR Resources Used

All resources are pre-existing in Honeycomb:

- **Patient** - Subject of imaging
- **Practitioner** - Ordering provider, technologist, radiologist
- **PractitionerRole** - Role-based access control
- **Encounter** - Patient visit context
- **ServiceRequest** - Imaging order
- **Questionnaire** - Safety screening form
- **QuestionnaireResponse** - Completed screening
- **BodyStructure** - Anatomical target
- **Procedure** - Imaging event
- **ImagingStudy** - Study metadata and series
- **DocumentReference** - DICOM access URLs
- **Observation** - Individual findings
- **RiskAssessment** - BI-RADS, Lung-RADS, etc.
- **DiagnosticReport** - Final signed report
- **Measure** - Quality metric definitions
- **MeasureReport** - Quality results

## API Methods

### Order Entry

```javascript
// Create imaging order
await Meteor.callAsync('radiology.createImagingOrder', {
  patientId: 'patient-123',
  modality: 'CT',
  modalityDisplay: 'CT (Computed Tomography)',
  priority: 'urgent',
  reasonDisplay: 'Abdominal pain'
});
```

### Safety Screening

```javascript
// Submit screening
await Meteor.callAsync('radiology.submitSafetyScreening', {
  questionnaireId: 'pre-imaging-safety',
  serviceRequestId: 'order-456',
  patientId: 'patient-123',
  items: [
    { linkId: 'allergy', answer: [{ valueBoolean: false }] }
  ]
});
```

### Image Acquisition

```javascript
// Start procedure
const procedureId = await Meteor.callAsync('radiology.startProcedure', {
  serviceRequestId: 'order-456',
  patientId: 'patient-123',
  modality: 'CT'
});

// Complete procedure
await Meteor.callAsync('radiology.completeProcedure', {
  procedureId: procedureId,
  serviceRequestId: 'order-456',
  patientId: 'patient-123',
  modality: 'CT'
});
```

### Interpretation

```javascript
// Add finding
const observationId = await Meteor.callAsync('radiology.addFinding', {
  imagingStudyId: 'study-789',
  patientId: 'patient-123',
  code: 'mass',
  codeDisplay: 'Mass identified',
  valueString: '2cm nodule in right lower lobe'
});

// Sign report
await Meteor.callAsync('radiology.signReport', {
  imagingStudyId: 'study-789',
  serviceRequestId: 'order-456',
  procedureId: 'proc-789',
  patientId: 'patient-123',
  observationIds: [observationId],
  conclusion: 'Suspicious pulmonary nodule. Recommend follow-up CT in 3 months.'
});
```

## Integration with DICOM Viewer

The package integrates with Honeycomb's existing DICOM viewer:

- `/dicom/studies` - Study list
- `/dicom/upload` - Image upload
- `/dicom/viewer/:studyId` - Cornerstone3D viewer

## Package Structure

```
npmPackages/radiology-workflow/
├── package.json
├── workflow.json
├── client.js
├── server.js
├── server/
│   ├── methods.js
│   └── hooks.js
├── client/
│   ├── RadiologyHome.jsx
│   ├── NursingDashboard.jsx
│   ├── TechDashboard.jsx
│   ├── ReadingDashboard.jsx
│   ├── hooks/
│   │   └── useRadiologyRole.js
│   └── components/
└── README.md
```

## Future Enhancements

- Admin UI for role assignment
- Push notifications for worklist updates
- Radiation dose tracking (DLP, CTDIvol)
- HL7v2 ADT integration
- Order reconciliation workflows
- DICOM MPPS integration
- Advanced quality measures dashboard

## License

Artistic 2.0


## References  

- [react-force-graph](https://vasturiano.github.io/react-force-graph/)