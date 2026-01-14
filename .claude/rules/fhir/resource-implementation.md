# FHIR Resource Implementation Guide

## Overview

When implementing a new FHIR resource in Honeycomb, follow these patterns to ensure consistency with existing resources and compliance with FHIR R4 specification.

## Implementation Checklist

Complete FHIR resource implementation requires changes across 15+ files:

### 1. Collection Registration (3 files)

**`server/main.js`** - Register in both Meteor.Collections and global.Collections:
```javascript
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

// Add to Meteor.Collections
Meteor.Collections = {
  // ... existing
  Observations: Observations
};

// Add to global.Collections
global.Collections = {
  // ... existing
  Observations: Observations
};

// Import methods
import '/imports/api/observations/methods';
```

**`imports/startup/client/collections.js`** - Client-side registration:
```javascript
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.Collections = {
  // ... existing
  Observations: Observations
};
```

**`server/publications/autopublish.js`** - Add to collectionsMap:
```javascript
const collectionsMap = {
  // ... existing
  'Observations': Observations
};
```

### 2. Schema Definition (1 file)

**`imports/lib/schemas/SimpleSchemas/Observations.js`**:
```javascript
import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';

export const Observations = new Mongo.Collection('Observations');

const ObservationSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Observation'
  },
  id: {
    type: String,
    optional: true
  },
  _id: {
    type: String,
    optional: true
  },
  status: {
    type: String,
    allowedValues: ['registered', 'preliminary', 'final', 'amended']
  },
  code: {
    type: Object,
    optional: true,
    blackbox: true
  },
  subject: {
    type: Object,
    optional: true,
    blackbox: true
  },
  effectiveDateTime: {
    type: String,
    optional: true
  },
  // ... more fields
});

Observations.attachSchema(ObservationSchema);
```

**Note**: This is the current SimpleSchema format. The codebase is migrating to official HL7 JsonSchemas in `imports/lib/schemas/JsonSchema/`. See `fhir-schema-expert` agent for migration assistance.

### 3. Meteor Methods (1 file)

**`imports/api/observations/methods.js`**:
```javascript
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { get } from 'lodash';
import { Random } from 'meteor/random';

Meteor.methods({
  'observations.insert': async function(observationData) {
    check(observationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const cleanObservation = {
      resourceType: 'Observation',
      status: get(observationData, 'status', 'final'),
      code: get(observationData, 'code', {}),
      subject: get(observationData, 'subject', {}),
      effectiveDateTime: get(observationData, 'effectiveDateTime', '')
    };

    // Generate IDs
    cleanObservation.id = Random.id();
    cleanObservation._id = cleanObservation.id;

    console.log('[observations.insert] Inserting:', cleanObservation._id);
    const result = await Observations.insertAsync(cleanObservation);
    return result;
  },

  'observations.update': async function(observationId, observationData) {
    check(observationId, String);
    check(observationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const existing = await Observations.findOneAsync({ _id: observationId });
    if (!existing) {
      throw new Meteor.Error('not-found');
    }

    const updates = {
      status: get(observationData, 'status', existing.status),
      code: get(observationData, 'code', existing.code),
      subject: get(observationData, 'subject', existing.subject),
      effectiveDateTime: get(observationData, 'effectiveDateTime', existing.effectiveDateTime)
    };

    console.log('[observations.update] Updating:', observationId);
    const result = await Observations.updateAsync(
      { _id: observationId },
      { $set: updates }
    );
    return result;
  },

  'observations.remove': async function(observationId) {
    check(observationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[observations.remove] Removing:', observationId);
    const result = await Observations.removeAsync({ _id: observationId });
    return result;
  },

  'observations.findOne': async function(observationId) {
    check(observationId, String);

    const observation = await Observations.findOneAsync({ _id: observationId });
    return observation;
  }
});
```

**Key Patterns**:
- Use Meteor v3 async methods (`insertAsync`, `updateAsync`, `removeAsync`, `findOneAsync`)
- Use `lodash.get()` with default values for circuit breaker pattern
- Generate both `id` and `_id` (FHIR id and MongoDB primary key)
- Use `console.log()` for debugging (include method name and record ID)
- Check `this.userId` for authentication

### 4. UI Components (3 files)

**`imports/ui-fhir/observations/ObservationsPage.jsx`** - List view with search/filters
**`imports/ui-fhir/observations/ObservationsTable.jsx`** - Table component
**`imports/ui-fhir/observations/ObservationDetail.jsx`** - Create/Edit form

See `/create-crud-microservice` command for automated generation.

### 5. Routes (1 file)

**`imports/ui/App.jsx`** - Add 3 routes:
```javascript
import ObservationsPage from '/imports/ui-fhir/observations/ObservationsPage';
import ObservationDetail from '/imports/ui-fhir/observations/ObservationDetail';

// In routes:
<Route path="/observations" element={<ObservationsPage />} />
<Route path="/observations/new" element={<ObservationDetail />} />
<Route path="/observations/:id" element={<ObservationDetail />} />
```

### 6. FhirDehydrator (1 file)

**`imports/lib/FhirDehydrator.js`** - Add flatten function:
```javascript
export function flattenObservation(observation) {
  const flattened = {
    _id: get(observation, '_id'),
    id: get(observation, 'id'),
    resourceType: 'Observation',
    status: get(observation, 'status'),
    code: get(observation, 'code.coding.0.code'),
    codeDisplay: get(observation, 'code.text', get(observation, 'code.coding.0.display')),
    effectiveDateTime: get(observation, 'effectiveDateTime'),
    patientReference: get(observation, 'subject.reference'),
    patientDisplay: get(observation, 'subject.display')
  };

  return flattened;
}
```

**Purpose**: Transform nested FHIR structure to flat object for tables/display.

### 7. Settings Configuration (2 files)

**`configs/settings.honeycomb.localhost.json`** (Light mode):
```json
{
  "public": {
    "modules": {
      "fhir": {
        "Observations": true
      }
    }
  },
  "private": {
    "fhir": {
      "rest": {
        "Observation": {
          "interactions": ["read", "create", "update", "delete", "search"],
          "search": true,
          "publication": true
        }
      }
    }
  }
}
```

**`configs/settings.honeycomb.dicom.localhost.json`** (Dark mode):
Same structure as above.

## Resource Archetypes

Different resources have different access patterns:

### Patient-Agnostic

Resources not owned by patients (Organization, Medication, Substance):
- ❌ No `subject` field
- ❌ No patient filtering
- ❌ No Session.get('selectedPatient')
- ✅ Global queries

**Example**:
```javascript
function MedicationsPage() {
  const medications = useTracker(() => {
    Meteor.subscribe('autopublish.Medications', {}, {});
    return Medications.find({}).fetch();
  }, []);

  return <MedicationsTable data={medications} />;
}
```

### Patient-Owned

Resources owned by patients (Observation, Condition, Procedure):
- ✅ `subject` field (Reference to Patient)
- ✅ Patient filtering required
- ✅ Use Session.get('selectedPatient')
- ✅ Auto-populate subject from Session

**Example**:
```javascript
function ObservationsPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);

  if (!patient) {
    return <Alert>No patient selected</Alert>;
  }

  const observations = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    Meteor.subscribe('autopublish.Observations', { patient: patientId }, {});
    return Observations.find({}).fetch();
  }, [patient]);

  return <ObservationsTable data={observations} />;
}
```

### Clinician-Mediated

Resources created by practitioners (ServiceRequest, MedicationRequest):
- ✅ `subject` field (Patient)
- ✅ `requester` or `author` field (Practitioner)
- ✅ Both contexts required
- ✅ Auto-populate both from Session
- ⚠️ Status workflow (draft → active)

**Example**:
```javascript
function ServiceRequestsPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);
  const practitioner = useTracker(() => Session.get('selectedPractitioner'), []);

  if (!patient || !practitioner) {
    return <Alert>Missing context</Alert>;
  }

  const requests = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    Meteor.subscribe('autopublish.ServiceRequests', { patient: patientId }, {});
    return ServiceRequests.find({}).fetch();
  }, [patient, practitioner]);

  return <ServiceRequestsTable data={requests} />;
}
```

## FHIR R4 Compliance

### Required Fields

Most FHIR resources require:
- `resourceType` (string, always required)
- `status` (coded value, usually required)
- `id` (FHIR identifier, server assigns if not provided)

### Common Data Types

**CodeableConcept**:
```javascript
{
  coding: [{
    system: 'http://loinc.org',
    code: '8867-4',
    display: 'Heart rate'
  }],
  text: 'Heart rate'
}
```

**Reference**:
```javascript
{
  reference: 'Patient/123',
  display: 'John Smith'
}
```

**Identifier**:
```javascript
{
  system: 'http://example.com/patients',
  value: 'MRN12345'
}
```

## Automated Generation

Use these commands for automated code generation:

```bash
# Generate complete microservice (15+ files)
/create-crud-microservice Observation

# Generate E2E tests (9 tests)
/create-crud-tests Observation

# Add patient context to tests
/add-patient-context-to-tests tests/nightwatch/honeycomb/crud.observations.js
```

## Verification

After implementation:

1. **Restart Meteor server**
2. **Verify in browser console**: `window.Observations`
3. **Navigate to list page**: `http://localhost:3000/observations`
4. **Test CRUD operations**:
   - Create new record
   - Edit existing record
   - Delete record
   - Search/filter
5. **Run E2E tests**: `npm test`

## Related

- Command: `/create-crud-microservice` - Automated generation
- Command: `/create-crud-tests` - Generate tests
- Agent: `fhir-schema-expert` - FHIR R4 spec questions, schema migration
- Rule: `rules/fhir/dehydrator.md` - FhirDehydrator patterns
- Rule: `rules/fhir/patient-filtering.md` - Patient filtering
- See `imports/ui-fhir/CLAUDE.md` for detailed UI patterns
