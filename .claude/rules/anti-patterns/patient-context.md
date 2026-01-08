# Anti-Pattern: Patient Context Management

## The Problem

Patient-scoped resources require proper patient context management. Common mistakes lead to:
- Empty pages (no data displayed)
- Wrong patient's data showing
- Test failures ("Expected 1 row, found 0")
- Subscription not filtering correctly

## ❌ WRONG Patterns

### Missing Patient Context Check

```javascript
// Component assumes patient is always available
function ObservationsPage() {
  const observations = useTracker(() => {
    return Observations.find({}).fetch(); // ❌ No patient filter!
  }, []);

  return <ObservationsTable data={observations} />;
}
```

### Inconsistent Session Keys

```javascript
// Setting patient context
Session.set('selectedPatient', patient);
Session.set('patientId', patient.id);

// Reading patient context (different keys!)
const patientId = Session.get('selectedPatientId'); // ❌ Wrong key!
```

### Missing Patient Filter in Subscription

```javascript
// Subscription without patient filter
Meteor.subscribe('autopublish.Observations', {}, {}); // ❌ No patient!

// Query without patient filter
const observations = Observations.find({}).fetch(); // ❌ Returns all patients' data!
```

### Not Restoring Context After Navigation

```javascript
// Test navigates without restoring Session
it('02. Verify list page', browser => {
  browser.url('http://localhost:3000/observations');
  // ❌ Session.get('selectedPatient') is null!
  browser.expect.element('#observationsTable tr').to.be.present;
});
```

## ✅ CORRECT Patterns

### Check Patient Context Before Rendering

```javascript
function ObservationsPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);

  // Early return if no patient
  if (!patient) {
    return (
      <Container>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  // Now safe to query patient-scoped data
  const observations = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    Meteor.subscribe('autopublish.Observations', { patient: patientId }, {});
    return Observations.find({}).fetch();
  }, [patient]);

  return <ObservationsTable data={observations} />;
}
```

### Consistent Session Keys

```javascript
// Always set both keys
function selectPatient(patient) {
  Session.set('selectedPatient', patient);       // Full object
  Session.set('selectedPatientId', patient.id);  // FHIR id only
}

// Always use the same keys
const patient = Session.get('selectedPatient');     // Full object
const patientId = Session.get('selectedPatientId'); // FHIR id
```

### Patient Filter in Subscription

```javascript
// Include patient in subscription params
const patientId = Session.get('selectedPatientId');
Meteor.subscribe('autopublish.Observations', { patient: patientId }, {});

// Or use FhirUtilities
import { FhirUtilities } from 'meteor/clinical:hl7-resource-datatypes';

let query = {};
if (Session.get('selectedPatientId')) {
  query = FhirUtilities.addPatientFilterToQuery(query);
}

const observations = Observations.find(query).fetch();
```

### Restore Context After Navigation

```javascript
// Use testUtils.navigateUrl() to preserve Session
it('02. Verify list page', browser => {
  testUtils.navigateUrl(browser, '/observations');
  browser.expect.element('#observationsTable tr').to.be.present;
});

// Or explicitly restore Session after browser.url()
it('02. Verify list page', browser => {
  browser.url('http://localhost:3000/observations');

  browser.executeAsync(function(patientId, done) {
    Meteor.call('patients.findOne', patientId, function(error, patient) {
      Session.set('selectedPatient', patient);
      Session.set('selectedPatientId', patient.id);
      done({ success: true });
    });
  }, [testPatientId]);

  browser.pause(1000); // Wait for subscription
  browser.expect.element('#observationsTable tr').to.be.present;
});
```

## Patient Context Lifecycle

### 1. Setting Patient Context (UI)

```javascript
// In PatientSidebar.jsx or similar
function handlePatientSelect(patient) {
  Session.set('selectedPatient', patient);
  Session.set('selectedPatientId', patient.id);
  navigate('/patients/' + patient.id);
}
```

### 2. Using Patient Context (Components)

```javascript
function PatientScopedComponent() {
  // Get patient from Session
  const patient = useTracker(() => Session.get('selectedPatient'), []);

  // Subscribe with patient filter
  const { data, isReady } = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    const handle = Meteor.subscribe('autopublish.Observations', {
      patient: patientId
    }, {});

    return {
      data: Observations.find({}).fetch(),
      isReady: handle.ready()
    };
  }, [patient]);

  if (!patient) {
    return <Alert>No patient selected</Alert>;
  }

  if (!isReady) {
    return <CircularProgress />;
  }

  return <ObservationsTable data={data} />;
}
```

### 3. Clearing Patient Context

```javascript
// On logout or patient deselection
function clearPatientContext() {
  Session.set('selectedPatient', null);
  Session.set('selectedPatientId', null);
  navigate('/patients');
}
```

## Resource Archetypes

Different resources have different patient context requirements:

### Patient-Agnostic (No Patient Context)

Resources that don't belong to a patient:
- Organization
- Medication
- Substance
- NutritionProduct
- Location

```javascript
// No patient check needed
function MedicationsPage() {
  const medications = useTracker(() => {
    Meteor.subscribe('autopublish.Medications', {}, {});
    return Medications.find({}).fetch();
  }, []);

  return <MedicationsTable data={medications} />;
}
```

### Patient-Owned (Requires Patient Context)

Resources that belong to a patient:
- Observation
- Condition
- Procedure
- AllergyIntolerance
- Immunization
- MedicationAdministration

```javascript
// Patient check required
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

### Clinician-Mediated (Requires Practitioner + Patient)

Resources created by practitioners for patients:
- ServiceRequest
- MedicationRequest
- NutritionOrder

```javascript
// Both practitioner and patient required
function ServiceRequestsPage() {
  const patient = useTracker(() => Session.get('selectedPatient'), []);
  const practitioner = useTracker(() => Session.get('selectedPractitioner'), []);

  if (!patient) {
    return <Alert>No patient selected</Alert>;
  }

  if (!practitioner) {
    return <Alert>No practitioner logged in</Alert>;
  }

  const requests = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    Meteor.subscribe('autopublish.ServiceRequests', { patient: patientId }, {});
    return ServiceRequests.find({}).fetch();
  }, [patient, practitioner]);

  return <ServiceRequestsTable data={requests} />;
}
```

## Test Patterns

### Patient-Agnostic Tests

```javascript
describe('Medications CRUD', function() {
  before(function(browser, done) {
    // Just login, no patient needed
    testUtils.login(browser, 'alice@test.com', 'password', done);
  });

  it('01. Verify list page', browser => {
    browser.url('http://localhost:3000/medications');
    browser.expect.element('#medicationsTable').to.be.present;
  });
});
```

### Patient-Owned Tests

```javascript
describe('Observations CRUD', function() {
  let testPatientId = null; // Suite-level tracking

  before(function(browser, done) {
    testUtils.login(browser, 'alice@test.com', 'password', done);
  });

  it('01. Create test patient', browser => {
    testUtils.createTestPatient(browser, 'Test', 'Patient', '1990-01-01', 'male',
      function(result) {
        testPatientId = result.result;

        // Set Session
        browser.executeAsync(function(patientId, done) {
          Meteor.call('patients.findOne', patientId, function(error, patient) {
            Session.set('selectedPatient', patient);
            Session.set('selectedPatientId', patient.id);
            done({ success: true });
          });
        }, [testPatientId]);

        browser.pause(1000);
      }
    );
  });

  it('02. Verify list page', browser => {
    // Restore Session after navigation
    testUtils.navigateUrl(browser, '/observations');
    browser.expect.element('#observationsTable').to.be.present;
  });
});
```

## Rule Summary

**Always check patient context** before rendering patient-scoped pages:
```javascript
if (!Session.get('selectedPatient')) {
  return <Alert>No patient selected</Alert>;
}
```

**Use consistent Session keys**:
- `Session.set('selectedPatient', patient)` - Full object
- `Session.set('selectedPatientId', patient.id)` - FHIR id

**Include patient in subscriptions**:
```javascript
Meteor.subscribe('autopublish.Observations', { patient: patientId }, {});
```

**Restore Session after navigation** in tests:
```javascript
testUtils.navigateUrl(browser, '/observations'); // Preserves Session
// OR
browser.executeAsync(function(patientId, done) { /* restore */ });
```

## Detection

Look for these patterns in patient-scoped components:
```javascript
// Missing patient check
function ObservationsPage() { // ❌ No patient check
  const observations = useTracker(...);
}

// Subscription without patient
Meteor.subscribe('autopublish.Observations', {}, {}); // ❌ No patient filter

// Inconsistent Session keys
Session.get('patientId') // vs Session.get('selectedPatientId')
```

## Related

- Agent: `.claude/agents/patient-context-debugger.md` - Debugging patient context issues
- Command: `.claude/commands/add-patient-context-to-tests.md` - Automated test fixing
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` lines 556-789
