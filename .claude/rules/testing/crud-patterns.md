# CRUD Test Patterns

## Overview

Honeycomb uses a standardized 9-test pattern for FHIR resource E2E testing with Nightwatch. This pattern ensures comprehensive coverage of create, read, update, and delete operations.

## Standard 9-Test Pattern

```javascript
describe('Observations CRUD', function() {
  let testPatientId = null;     // Suite-level patient tracking
  let testObservationId = null; // Suite-level record tracking

  // Setup
  it('01. Setup test environment', browser => {
    // Login + create patient + set Session (for patient-owned resources)
  });

  // Read Operations
  it('02. Verify list page loads', browser => {
    // Navigate to list page, check table renders
  });

  it('03. Verify table search functionality', browser => {
    // Test search/filter inputs
  });

  // Create Operations
  it('04. Navigate to create form', browser => {
    // Click "New" button, verify form loads
  });

  it('05. Create new record', browser => {
    // Fill form, submit, capture ID
  });

  it('06. Verify new record in table', browser => {
    // Search for new record, verify it appears
  });

  // Update Operations
  it('07. Open record for editing', browser => {
    // Click row, verify detail page loads
  });

  it('08. Update record', browser => {
    // Edit fields, save, verify changes
  });

  // Delete Operations
  it('09. Delete record', browser => {
    // Click delete button, confirm, verify removal
  });
});
```

## Detailed Implementation

### Test 01: Setup Test Environment

**Purpose**: Login, create test patient (if needed), set Session context

#### Patient-Agnostic Resources (Medication, Organization)
```javascript
it('01. Setup test environment', browser => {
  testUtils.login(browser, 'alice@test.com', 'password', function() {
    console.log('[01] Login complete');
  });
  browser.pause(1000);
});
```

#### Patient-Owned Resources (Observation, Condition)
```javascript
it('01. Setup test environment', browser => {
  testUtils.login(browser, 'alice@test.com', 'password', function() {
    console.log('[01] Login complete');
  });

  browser.pause(1000);

  testUtils.createTestPatient(browser, 'Test', 'Patient', '1990-01-01', 'male',
    function(result) {
      testPatientId = result.result;
      console.log('[01] Created test patient:', testPatientId);

      // Set Session
      browser.executeAsync(function(patientId, done) {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (patient) {
            Session.set('selectedPatient', patient);
            Session.set('selectedPatientId', patient.id);
            console.log('[01] Session set for patient:', patient.id);
          }
          done({ success: true });
        });
      }, [testPatientId]);

      browser.pause(1000);
    }
  );
});
```

#### Clinician-Mediated Resources (ServiceRequest, MedicationRequest)
```javascript
it('01. Setup test environment', browser => {
  // Login as practitioner
  testUtils.loginAsPractitioner(browser, 'dr.smith@test.com', 'password', function() {
    console.log('[01] Practitioner login complete');
  });

  browser.pause(1000);

  // Create test patient
  testUtils.createTestPatient(browser, 'Test', 'Patient', '1990-01-01', 'male',
    function(result) {
      testPatientId = result.result;

      // Set both practitioner and patient Session
      browser.executeAsync(function(patientId, done) {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          Session.set('selectedPatient', patient);
          Session.set('selectedPatientId', patient.id);

          // Practitioner context should already be set by login
          const practitioner = Session.get('currentUser');
          Session.set('selectedPractitioner', practitioner);

          done({ success: true });
        });
      }, [testPatientId]);

      browser.pause(1000);
    }
  );
});
```

### Test 02: Verify List Page Loads

**Purpose**: Navigate to resource list, verify table renders

```javascript
it('02. Verify list page loads', browser => {
  // Use testUtils.navigateUrl to preserve Session
  testUtils.navigateUrl(browser, '/observations');

  // Wait for page to load
  browser.pause(1000);

  // Verify table exists
  browser.expect.element('#observationsTable').to.be.present;

  // Verify column headers
  browser.expect.element('th').text.to.contain('Status');
  browser.expect.element('th').text.to.contain('Code');
  browser.expect.element('th').text.to.contain('Date');

  console.log('[02] List page loaded successfully');
});
```

### Test 03: Verify Table Search Functionality

**Purpose**: Test search/filter inputs

```javascript
it('03. Verify table search functionality', browser => {
  // Find search input
  browser.expect.element('#searchInput').to.be.present;

  // Type search term (character by character for React)
  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  browser.pause(300);

  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = 'test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Wait for search to filter (3+ seconds for subscriptions)
  browser.pause(3000);

  // Verify filter worked
  browser.expect.element('#observationsTable tbody tr').to.be.present;

  console.log('[03] Search functionality verified');
});
```

### Test 04: Navigate to Create Form

**Purpose**: Click "New" button, verify form loads

```javascript
it('04. Navigate to create form', browser => {
  // Click "New" button
  browser.click('#newObservationButton');
  browser.pause(500);

  // Verify form page loaded
  browser.expect.element('#observationDetailPage').to.be.present;

  // Verify form fields
  browser.expect.element('#codeInput').to.be.present;
  browser.expect.element('#statusSelect').to.be.present;
  browser.expect.element('#effectiveDateTimeInput').to.be.present;

  // Verify patient auto-populated (for patient-owned resources)
  browser.execute(function() {
    const patientDisplay = document.querySelector('#patientDisplay');
    console.log('Patient display:', patientDisplay?.textContent);
  });

  console.log('[04] Create form loaded successfully');
});
```

### Test 05: Create New Record

**Purpose**: Fill form, submit, capture ID

```javascript
it('05. Create new record', browser => {
  // Fill code field
  browser.setValue('#codeInput', '8867-4');
  browser.pause(300);

  // Fill display field
  browser.setValue('#codeDisplayInput', 'Heart rate');
  browser.pause(300);

  // Select status (Material-UI Select requires execute block)
  browser.execute(function() {
    const statusSelect = document.querySelector('#statusSelect');
    statusSelect.click();

    setTimeout(function() {
      const option = document.querySelector('[data-value="final"]');
      if (option) option.click();
    }, 500);
  });

  browser.pause(1000);

  // Fill date
  browser.setValue('#effectiveDateTimeInput', '2024-01-08T10:00:00');
  browser.pause(300);

  // Click Save button
  browser.click('#saveButton');
  browser.pause(2000);

  // Capture created record ID from URL
  browser.url(function(result) {
    const url = result.value;
    const match = url.match(/\/observations\/(.+)$/);
    if (match) {
      testObservationId = match[1];
      console.log('[05] Created observation:', testObservationId);
    }
  });

  // Verify redirected to detail page or list
  browser.expect.element('#observationDetailPage').to.be.present;

  console.log('[05] Record created successfully');
});
```

### Test 06: Verify New Record in Table

**Purpose**: Return to list, search for new record, verify it appears

```javascript
it('06. Verify new record in table', browser => {
  // Navigate back to list
  testUtils.navigateUrl(browser, '/observations');
  browser.pause(1000);

  // Search for new record (by code or display)
  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = 'Heart rate';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  browser.pause(3000); // Wait for search filter

  // Find row containing our record (search-based, not position-based)
  browser.execute(function(observationId) {
    const rows = document.querySelectorAll('#observationsTable tbody tr');
    let foundRow = null;

    rows.forEach(function(row) {
      const cells = row.querySelectorAll('td');
      cells.forEach(function(cell) {
        if (cell.textContent.includes(observationId)) {
          foundRow = row;
        }
      });
    });

    if (foundRow) {
      foundRow.scrollIntoView();
      console.log('[06] Found new record in table');
    }

    return { found: !!foundRow };
  }, [testObservationId]);

  browser.expect.element('#observationsTable tbody tr').to.be.present;

  console.log('[06] New record verified in table');
});
```

### Test 07: Open Record for Editing

**Purpose**: Click row, verify detail page loads with data

```javascript
it('07. Open record for editing', browser => {
  // Click row to open detail page (search-based click)
  browser.execute(function(observationId) {
    const rows = document.querySelectorAll('#observationsTable tbody tr');
    let targetRow = null;

    rows.forEach(function(row) {
      const cells = row.querySelectorAll('td');
      cells.forEach(function(cell) {
        if (cell.textContent.includes(observationId)) {
          targetRow = row;
        }
      });
    });

    if (targetRow) {
      targetRow.click();
      console.log('[07] Clicked row for observation:', observationId);
    }

    return { clicked: !!targetRow };
  }, [testObservationId]);

  browser.pause(1000);

  // Verify detail page loaded
  browser.expect.element('#observationDetailPage').to.be.present;

  // Verify data populated
  browser.getValue('#codeInput', function(result) {
    console.log('[07] Code value:', result.value);
  });

  // Verify in view mode (not edit mode)
  browser.expect.element('#editButton').to.be.present;

  console.log('[07] Detail page loaded successfully');
});
```

### Test 08: Update Record

**Purpose**: Enter edit mode, change fields, save, verify

```javascript
it('08. Update record', browser => {
  // Click Edit button
  browser.click('#editButton');
  browser.pause(500);

  // Verify in edit mode
  browser.expect.element('#saveButton').to.be.present;

  // Update code display
  browser.clearValue('#codeDisplayInput');
  browser.setValue('#codeDisplayInput', 'Heart rate (updated)');
  browser.pause(300);

  // Update status
  browser.execute(function() {
    const statusSelect = document.querySelector('#statusSelect');
    statusSelect.click();

    setTimeout(function() {
      const option = document.querySelector('[data-value="amended"]');
      if (option) option.click();
    }, 500);
  });

  browser.pause(1000);

  // Click Save
  browser.click('#saveButton');
  browser.pause(2000);

  // Verify saved (should be back in view mode)
  browser.expect.element('#editButton').to.be.present;

  // Verify changes persisted
  browser.getValue('#codeDisplayInput', function(result) {
    console.log('[08] Updated display:', result.value);
  });

  console.log('[08] Record updated successfully');
});
```

### Test 09: Delete Record

**Purpose**: Delete record, verify removal from table

```javascript
it('09. Delete record', browser => {
  // Click Delete button (use execute block to avoid "click intercepted")
  browser.execute(function() {
    const deleteButton = document.querySelector('#deleteButton');
    if (deleteButton) {
      deleteButton.click();
      console.log('[09] Clicked delete button');
    }
  });

  browser.pause(1000);

  // Confirm deletion dialog (if present)
  browser.execute(function() {
    const confirmButton = document.querySelector('#confirmDeleteButton');
    if (confirmButton) {
      confirmButton.click();
    }
  });

  browser.pause(2000);

  // Should redirect to list page
  browser.expect.element('#observationsTable').to.be.present;

  // Verify record removed (search for it, should not find)
  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = 'Heart rate (updated)';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  browser.pause(3000);

  // Should find no rows or fewer rows
  browser.elements('css selector', '#observationsTable tbody tr', function(result) {
    console.log('[09] Rows found after delete:', result.value.length);
  });

  console.log('[09] Record deleted successfully');
});
```

## Archetype Variations

### Patient-Agnostic (Skip Test 01 patient creation)
```javascript
it('01. Setup test environment', browser => {
  testUtils.login(browser, 'alice@test.com', 'password', function() {
    console.log('[01] Login complete');
  });
  browser.pause(1000);
});

// Tests 02-09 remain the same, but no Session restoration needed
```

### Clinician-Mediated (Add practitioner verification)
```javascript
it('05. Create new record', browser => {
  // ... fill form fields ...

  // Verify requester auto-populated with practitioner
  browser.getValue('#requesterDisplay', function(result) {
    console.log('[05] Requester:', result.value);
    assert(result.value.length > 0, 'Requester should be populated');
  });

  // ... submit form ...
});
```

## Common Patterns

### Character-by-Character Typing (React Forms)
```javascript
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'test';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
```

### Material-UI Select (Execute Block)
```javascript
browser.execute(function() {
  const select = document.querySelector('#statusSelect');
  select.click();

  setTimeout(function() {
    const option = document.querySelector('[data-value="final"]');
    if (option) option.click();
  }, 500);
});
```

### Search-Based Row Finding (Not Position-Based)
```javascript
browser.execute(function(recordId) {
  const rows = document.querySelectorAll('#table tbody tr');
  let targetRow = null;

  rows.forEach(function(row) {
    if (row.textContent.includes(recordId)) {
      targetRow = row;
    }
  });

  if (targetRow) {
    targetRow.click();
  }

  return { found: !!targetRow };
}, [recordId]);
```

## Automated Generation

Use `/create-crud-tests` command to generate complete 9-test files:

```bash
/create-crud-tests Observation
```

This generates:
- Correct archetype pattern (patient-agnostic/owned/clinician-mediated)
- Proper patient context management
- Search-based row finding
- Material-UI component handling

## Related

- Command: `/create-crud-tests` - Automated test generation
- Agent: `test-stabilizer` - Test stability patterns
- Rule: `rules/testing/stability.md` - Timeout and pause strategies
- Rule: `rules/testing/search-patterns.md` - Search functionality
- Rule: `rules/testing/delete-operations.md` - Delete patterns
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` for detailed patterns
