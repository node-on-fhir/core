# Patient Filtering Patterns

## Overview

Patient-scoped FHIR resources must filter data by patient to ensure:
- Users only see their own patient's data
- Multi-tenant data isolation
- FHIR Compartment compliance
- SMART on FHIR scope enforcement

## Core Pattern

### FhirUtilities.addPatientFilterToQuery()

The primary method for adding patient filters to MongoDB queries:

```javascript
import { FhirUtilities } from 'meteor/clinical:hl7-resource-datatypes';

// Base query
let query = {};

// Add patient filter if patient context exists
if (Session.get('selectedPatientId')) {
  query = FhirUtilities.addPatientFilterToQuery(query);
}

// Execute filtered query
const observations = Observations.find(query).fetch();
```

### What It Does

`FhirUtilities.addPatientFilterToQuery()` handles multiple reference formats:

1. **subject.reference** (most common):
   ```javascript
   { 'subject.reference': 'Patient/123' }
   ```

2. **patient.reference** (some resources):
   ```javascript
   { 'patient.reference': 'Patient/123' }
   ```

3. **URN format**:
   ```javascript
   { 'subject.reference': 'urn:uuid:123-456-789' }
   ```

4. **$or query** (handles both `patient` and `subject` fields):
   ```javascript
   {
     $or: [
       { 'subject.reference': 'Patient/123' },
       { 'patient.reference': 'Patient/123' }
     ]
   }
   ```

## Usage Patterns

### In UI Components

```javascript
function ObservationsPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);

  const observations = useTracker(() => {
    // Build query with patient filter
    let query = {};
    if (Session.get('selectedPatientId')) {
      query = FhirUtilities.addPatientFilterToQuery(query);
    }

    // Subscribe with patient filter
    Meteor.subscribe('autopublish.Observations', {
      patient: Session.get('selectedPatientId')
    }, {});

    // Execute filtered query
    return Observations.find(query).fetch();
  }, [patient]);

  if (!patient) {
    return <Alert>No patient selected</Alert>;
  }

  return <ObservationsTable data={observations} />;
}
```

### In Server Publications

```javascript
// server/publications/autopublish.js

Meteor.publish('autopublish.Observations', function(query, options) {
  // Extract patient ID from query
  const patientId = query.patient;

  // Build patient filter
  let mongoQuery = {};
  if (patientId) {
    mongoQuery['subject.reference'] = `Patient/${patientId}`;
  }

  // Apply additional filters
  if (query.category) {
    mongoQuery['category.coding.code'] = query.category;
  }

  // Return filtered cursor
  return Observations.find(mongoQuery, options);
});
```

### In Meteor Methods

```javascript
Meteor.methods({
  'observations.findByPatient': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    // Build query with patient filter
    const query = {
      'subject.reference': `Patient/${patientId}`
    };

    // Execute query
    const observations = await Observations.find(query).fetchAsync();
    return observations;
  }
});
```

## Reference Format Variations

FHIR allows multiple reference formats. Your code must handle all:

### Format 1: Relative Reference (Most Common)
```javascript
{
  subject: {
    reference: "Patient/123",
    display: "John Smith"
  }
}
```

### Format 2: Absolute URL
```javascript
{
  subject: {
    reference: "https://example.com/fhir/Patient/123",
    display: "John Smith"
  }
}
```

### Format 3: URN
```javascript
{
  subject: {
    reference: "urn:uuid:53fefa32-fcbb-4ff8-8a92-55ee120877b7",
    display: "John Smith"
  }
}
```

### Format 4: Logical Reference (Identifier)
```javascript
{
  subject: {
    identifier: {
      system: "http://example.com/patients",
      value: "MRN12345"
    },
    display: "John Smith"
  }
}
```

## Handling Each Format

### Simple String Match (Format 1 & 2)
```javascript
const query = {
  'subject.reference': `Patient/${patientId}`
};

// Matches:
// - "Patient/123"
// - Does NOT match absolute URLs or URNs
```

### Pattern Match (Format 1 & 2)
```javascript
const query = {
  'subject.reference': { $regex: `Patient/${patientId}` }
};

// Matches:
// - "Patient/123"
// - "https://example.com/fhir/Patient/123"
```

### URN Match (Format 3)
```javascript
const query = {
  'subject.reference': `urn:uuid:${patientId}`
};

// Matches:
// - "urn:uuid:53fefa32-fcbb-4ff8-8a92-55ee120877b7"
```

### Identifier Match (Format 4)
```javascript
const query = {
  'subject.identifier.value': mrnValue
};

// Matches identifier-based references
```

### Combined Query (All Formats)
```javascript
const query = {
  $or: [
    { 'subject.reference': `Patient/${patientId}` },
    { 'subject.reference': { $regex: `Patient/${patientId}` } },
    { 'subject.reference': `urn:uuid:${patientId}` },
    { 'patient.reference': `Patient/${patientId}` }
  ]
};
```

**Recommendation**: Use `FhirUtilities.addPatientFilterToQuery()` to handle all formats automatically.

## Multi-Tenant Isolation

For multi-tenant deployments, enforce organization-level isolation:

```javascript
function buildSecureQuery(userId, patientId) {
  // Get user's organization
  const user = Meteor.users.findOne({ _id: userId });
  const orgId = get(user, 'profile.organizationId');

  // Build query with both organization and patient filters
  const query = {
    'meta.organization': orgId,
    'subject.reference': `Patient/${patientId}`
  };

  return query;
}

// Usage
Meteor.methods({
  'observations.findSecure': async function(patientId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const query = buildSecureQuery(this.userId, patientId);
    const observations = await Observations.find(query).fetchAsync();
    return observations;
  }
});
```

## FHIR Compartments

FHIR defines "Compartments" for patient-scoped data. Honeycomb supports:

### Patient Compartment

Resources that belong to a patient:
- AllergyIntolerance
- CarePlan
- CareTeam
- Condition
- DiagnosticReport
- DocumentReference
- Encounter
- Goal
- Immunization
- MedicationAdministration
- MedicationRequest
- Observation
- Procedure

All must filter by patient:
```javascript
{ 'subject.reference': 'Patient/123' }
```

### Practitioner Compartment

Resources attributed to a practitioner:
- Observation (performer)
- Procedure (performer)
- MedicationRequest (requester)

Filter by practitioner:
```javascript
{ 'performer.reference': 'Practitioner/456' }
```

### Device Compartment

Resources from a device:
- Observation (device)
- DiagnosticReport (result device)

Filter by device:
```javascript
{ 'device.reference': 'Device/789' }
```

## Query Performance

### Index Requirements

Patient-scoped queries require indexes:

```javascript
// MongoDB shell
db.Observations.createIndex({ 'subject.reference': 1 });
db.Conditions.createIndex({ 'subject.reference': 1 });
db.MedicationRequests.createIndex({ 'subject.reference': 1 });

// Compound index for common queries
db.Observations.createIndex({
  'subject.reference': 1,
  'category.coding.code': 1,
  'effectiveDateTime': -1
});
```

### Query Optimization

```javascript
// ❌ SLOW: No patient filter
const observations = Observations.find({}).fetch(); // Scans all records

// ✅ FAST: Patient filter first
const observations = Observations.find({
  'subject.reference': 'Patient/123'
}).fetch(); // Uses index

// ✅ FASTER: Compound filter
const observations = Observations.find({
  'subject.reference': 'Patient/123',
  'category.coding.code': 'vital-signs'
}).fetch(); // Uses compound index
```

## Common Mistakes

### Mistake 1: Not checking for patient context

```javascript
// ❌ WRONG: Returns all patients' data
const observations = Observations.find({}).fetch();

// ✅ CORRECT: Filter by patient
let query = {};
if (Session.get('selectedPatientId')) {
  query = FhirUtilities.addPatientFilterToQuery(query);
}
const observations = Observations.find(query).fetch();
```

### Mistake 2: Using wrong reference field

```javascript
// ❌ WRONG: Assumes 'subject' field
const query = { 'subject.reference': 'Patient/123' };

// Some resources use 'patient' instead:
// - Immunization.patient
// - DiagnosticReport.patient

// ✅ CORRECT: Use FhirUtilities (handles both)
const query = FhirUtilities.addPatientFilterToQuery({});
```

### Mistake 3: Not handling reference format variations

```javascript
// ❌ WRONG: Only matches exact string
const query = { 'subject.reference': 'Patient/123' };
// Misses: "https://example.com/fhir/Patient/123"

// ✅ CORRECT: Use regex or FhirUtilities
const query = {
  'subject.reference': { $regex: `Patient/${patientId}` }
};
// Or better:
const query = FhirUtilities.addPatientFilterToQuery({});
```

### Mistake 4: Client-side filtering instead of server-side

```javascript
// ❌ WRONG: Fetches all, filters client-side (security risk!)
const allObservations = Observations.find({}).fetch();
const patientObservations = allObservations.filter(obs =>
  obs.subject?.reference === `Patient/${patientId}`
);

// ✅ CORRECT: Filter on server (subscription + query)
Meteor.subscribe('autopublish.Observations', { patient: patientId }, {});
const query = FhirUtilities.addPatientFilterToQuery({});
const observations = Observations.find(query).fetch();
```

## Testing Patient Filtering

```javascript
describe('Patient Filtering', function() {
  let patient1Id, patient2Id;

  before(function() {
    // Create two patients
    patient1Id = Patients.insert({ name: [{ family: 'Smith' }] });
    patient2Id = Patients.insert({ name: [{ family: 'Jones' }] });

    // Create observations for each patient
    Observations.insert({
      subject: { reference: `Patient/${patient1Id}` },
      code: { text: 'Patient 1 Observation' }
    });

    Observations.insert({
      subject: { reference: `Patient/${patient2Id}` },
      code: { text: 'Patient 2 Observation' }
    });
  });

  it('should only return patient 1 observations', function() {
    Session.set('selectedPatientId', patient1Id);

    const query = FhirUtilities.addPatientFilterToQuery({});
    const observations = Observations.find(query).fetch();

    assert.equal(observations.length, 1);
    assert.equal(observations[0].subject.reference, `Patient/${patient1Id}`);
  });

  it('should only return patient 2 observations', function() {
    Session.set('selectedPatientId', patient2Id);

    const query = FhirUtilities.addPatientFilterToQuery({});
    const observations = Observations.find(query).fetch();

    assert.equal(observations.length, 1);
    assert.equal(observations[0].subject.reference, `Patient/${patient2Id}`);
  });
});
```

## Related

- Rule: `rules/anti-patterns/patient-context.md` - Patient context management
- Agent: `patient-context-debugger` - Debugging patient context issues
- Agent: `fhir-schema-expert` - FHIR compartment definitions
- See `imports/lib/FhirUtilities.js` for implementation
- See `imports/ui-fhir/CLAUDE.md` lines 268-338
