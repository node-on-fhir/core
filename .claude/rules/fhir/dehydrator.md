# FHIR Dehydrator Patterns

## Overview

The FhirDehydrator (`imports/lib/FhirDehydrator.js`) transforms nested FHIR resources into flat objects suitable for table display, search indexes, and UI components.

## Purpose

FHIR resources are deeply nested JSON objects:
```javascript
{
  resourceType: "Observation",
  code: {
    coding: [{
      system: "http://loinc.org",
      code: "8867-4",
      display: "Heart rate"
    }],
    text: "Heart rate"
  },
  subject: {
    reference: "Patient/123",
    display: "John Smith"
  }
}
```

Tables need flat structures:
```javascript
{
  code: "8867-4",
  codeDisplay: "Heart rate",
  patientReference: "Patient/123",
  patientDisplay: "John Smith"
}
```

## Standard Pattern

Every FHIR resource should have a `flatten{ResourceType}()` function:

```javascript
import { get } from 'lodash';

export function flattenObservation(observation) {
  const flattened = {
    // Primary keys (always include)
    _id: get(observation, '_id'),
    id: get(observation, 'id'),
    resourceType: 'Observation',

    // Status (most resources)
    status: get(observation, 'status'),

    // Codes (CodeableConcept → flat)
    code: get(observation, 'code.coding.0.code'),
    codeSystem: get(observation, 'code.coding.0.system'),
    codeDisplay: get(observation, 'code.text', get(observation, 'code.coding.0.display')),

    // Dates/Times
    effectiveDateTime: get(observation, 'effectiveDateTime'),

    // References (Patient, Practitioner, etc.)
    patientReference: get(observation, 'subject.reference'),
    patientDisplay: get(observation, 'subject.display'),

    // Values (if applicable)
    valueQuantity: get(observation, 'valueQuantity.value'),
    valueUnit: get(observation, 'valueQuantity.unit'),

    // Categories (if applicable)
    category: get(observation, 'category.0.coding.0.code'),
    categoryDisplay: get(observation, 'category.0.coding.0.display')
  };

  return flattened;
}
```

## Key Principles

### 1. Always Use lodash.get() with Defaults

**❌ WRONG: Direct property access**
```javascript
const code = observation.code.coding[0].code; // Crashes if missing
```

**✅ CORRECT: Circuit breaker pattern**
```javascript
const code = get(observation, 'code.coding.0.code'); // Returns undefined if missing
const code = get(observation, 'code.coding.0.code', 'Unknown'); // Returns 'Unknown' if missing
```

### 2. Preserve Both _id and id

```javascript
// Always include both primary keys
_id: get(observation, '_id'),  // MongoDB primary key
id: get(observation, 'id')      // FHIR identifier
```

**Why**: Components may need either:
- MongoDB queries use `_id`
- FHIR API responses use `id`
- Navigation URLs use `id`

### 3. Extract Coding with Fallback

**CodeableConcept** has two display values:
- `code.text` (preferred, human-readable)
- `code.coding[0].display` (fallback, from coding system)

```javascript
codeDisplay: get(observation, 'code.text', get(observation, 'code.coding.0.display'))
```

### 4. Flatten References

**Reference** structure:
```javascript
{
  reference: "Patient/123",
  display: "John Smith"
}
```

**Flatten to**:
```javascript
patientReference: get(observation, 'subject.reference'),
patientDisplay: get(observation, 'subject.display')
```

### 5. Handle Arrays

**FHIR arrays** (category, identifier, etc.):
```javascript
// First element
category: get(observation, 'category.0.coding.0.code')

// Or map all elements
categories: get(observation, 'category', []).map(cat =>
  get(cat, 'coding.0.code')
)
```

## Resource-Specific Examples

### Patient

```javascript
export function flattenPatient(patient) {
  const flattened = {
    _id: get(patient, '_id'),
    id: get(patient, 'id'),
    resourceType: 'Patient',

    // Name
    familyName: get(patient, 'name.0.family'),
    givenName: get(patient, 'name.0.given.0'),
    fullName: get(patient, 'name.0.text',
      `${get(patient, 'name.0.given.0', '')} ${get(patient, 'name.0.family', '')}`
    ),

    // Demographics
    gender: get(patient, 'gender'),
    birthDate: get(patient, 'birthDate'),

    // Identifiers
    mrn: get(patient, 'identifier', []).find(id =>
      get(id, 'type.coding.0.code') === 'MR'
    )?.value,

    // Contact
    phone: get(patient, 'telecom', []).find(t => t.system === 'phone')?.value,
    email: get(patient, 'telecom', []).find(t => t.system === 'email')?.value
  };

  return flattened;
}
```

### Condition

```javascript
export function flattenCondition(condition) {
  const flattened = {
    _id: get(condition, '_id'),
    id: get(condition, 'id'),
    resourceType: 'Condition',

    // Status
    clinicalStatus: get(condition, 'clinicalStatus.coding.0.code'),
    verificationStatus: get(condition, 'verificationStatus.coding.0.code'),

    // Code
    code: get(condition, 'code.coding.0.code'),
    codeSystem: get(condition, 'code.coding.0.system'),
    codeDisplay: get(condition, 'code.text', get(condition, 'code.coding.0.display')),

    // Category
    category: get(condition, 'category.0.coding.0.code'),
    categoryDisplay: get(condition, 'category.0.coding.0.display'),

    // Dates
    onsetDateTime: get(condition, 'onsetDateTime'),
    recordedDate: get(condition, 'recordedDate'),

    // References
    patientReference: get(condition, 'subject.reference'),
    patientDisplay: get(condition, 'subject.display'),
    encounterReference: get(condition, 'encounter.reference')
  };

  return flattened;
}
```

### MedicationRequest

```javascript
export function flattenMedicationRequest(request) {
  const flattened = {
    _id: get(request, '_id'),
    id: get(request, 'id'),
    resourceType: 'MedicationRequest',

    // Status & Intent
    status: get(request, 'status'),
    intent: get(request, 'intent'),

    // Medication (CodeableConcept or Reference)
    medicationCode: get(request, 'medicationCodeableConcept.coding.0.code'),
    medicationDisplay: get(request, 'medicationCodeableConcept.text',
      get(request, 'medicationCodeableConcept.coding.0.display')
    ),
    medicationReference: get(request, 'medicationReference.reference'),

    // Dosage
    dosageText: get(request, 'dosageInstruction.0.text'),
    route: get(request, 'dosageInstruction.0.route.coding.0.code'),
    routeDisplay: get(request, 'dosageInstruction.0.route.coding.0.display'),

    // Dates
    authoredOn: get(request, 'authoredOn'),

    // References
    patientReference: get(request, 'subject.reference'),
    patientDisplay: get(request, 'subject.display'),
    requesterReference: get(request, 'requester.reference'),
    requesterDisplay: get(request, 'requester.display')
  };

  return flattened;
}
```

## Usage Patterns

### In Table Components

```javascript
// Transform data before passing to table
const flattenedObservations = observations.map(obs =>
  FhirDehydrator.flattenObservation(obs)
);

<ObservationsTable data={flattenedObservations} />
```

### In Search Indexes

```javascript
// Build search index with flattened fields
observations.forEach(obs => {
  const flat = FhirDehydrator.flattenObservation(obs);

  searchIndex[obs._id] = {
    searchableText: [
      flat.codeDisplay,
      flat.patientDisplay,
      flat.status
    ].join(' ').toLowerCase()
  };
});
```

### In Export Functions

```javascript
// Export to CSV with flat structure
function exportToCsv(observations) {
  const rows = observations.map(obs => {
    const flat = FhirDehydrator.flattenObservation(obs);
    return {
      'Code': flat.code,
      'Display': flat.codeDisplay,
      'Date': flat.effectiveDateTime,
      'Patient': flat.patientDisplay,
      'Status': flat.status
    };
  });

  return convertToCSV(rows);
}
```

## Common Mistakes

### Mistake 1: Not handling missing data

```javascript
// ❌ WRONG: Crashes if code is missing
codeDisplay: observation.code.text

// ✅ CORRECT: Returns undefined if missing
codeDisplay: get(observation, 'code.text')

// ✅ CORRECT: Returns default if missing
codeDisplay: get(observation, 'code.text', 'No code')
```

### Mistake 2: Not preserving both IDs

```javascript
// ❌ WRONG: Only one ID
_id: observation._id || observation.id

// ✅ CORRECT: Both IDs preserved
_id: get(observation, '_id'),
id: get(observation, 'id')
```

### Mistake 3: Not handling arrays safely

```javascript
// ❌ WRONG: Crashes if category is missing
category: observation.category[0].coding[0].code

// ✅ CORRECT: Safe array access
category: get(observation, 'category.0.coding.0.code')
```

### Mistake 4: Not using fallback for display

```javascript
// ❌ WRONG: Misses fallback
codeDisplay: observation.code.text

// ✅ CORRECT: Uses fallback
codeDisplay: get(observation, 'code.text', get(observation, 'code.coding.0.display'))
```

## Testing Dehydrator Functions

```javascript
import { flattenObservation } from '/imports/lib/FhirDehydrator';

describe('FhirDehydrator.flattenObservation', function() {
  it('should flatten full observation', function() {
    const observation = {
      _id: '123',
      id: 'obs-456',
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8867-4',
          display: 'Heart rate'
        }],
        text: 'Heart rate'
      },
      subject: {
        reference: 'Patient/789',
        display: 'John Smith'
      }
    };

    const flattened = flattenObservation(observation);

    assert.equal(flattened._id, '123');
    assert.equal(flattened.id, 'obs-456');
    assert.equal(flattened.status, 'final');
    assert.equal(flattened.code, '8867-4');
    assert.equal(flattened.codeDisplay, 'Heart rate');
    assert.equal(flattened.patientReference, 'Patient/789');
    assert.equal(flattened.patientDisplay, 'John Smith');
  });

  it('should handle missing fields gracefully', function() {
    const minimalObservation = {
      _id: '123',
      resourceType: 'Observation',
      status: 'final'
    };

    const flattened = flattenObservation(minimalObservation);

    assert.equal(flattened._id, '123');
    assert.equal(flattened.status, 'final');
    assert.isUndefined(flattened.code); // Missing field returns undefined
    assert.isUndefined(flattened.codeDisplay);
  });
});
```

## When to Add Dehydrator Function

Add a `flatten{ResourceType}()` function when:
1. Creating a new FHIR resource implementation
2. Building a table component for the resource
3. Implementing search functionality
4. Exporting data to CSV/JSON
5. Creating analytics/reports

## Related

- Command: `/create-crud-microservice` - Generates dehydrator functions
- Rule: `rules/fhir/resource-implementation.md` - Resource patterns
- File: `imports/lib/FhirDehydrator.js` - Implementation file
- See `imports/ui-fhir/CLAUDE.md` lines 712-751 for detailed patterns
