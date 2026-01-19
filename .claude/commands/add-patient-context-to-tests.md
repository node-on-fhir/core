# Slash Command: /add-patient-context-to-tests

Add robust patient context management to existing Nightwatch CRUD test files.

## Description

This command implements the critical patient context pattern that prevents "No data" issues in tests when running in CI with large datasets and subscription limits. It adds suite-level patient ID tracking and server-side Meteor method fetching to ensure patient context persists across all tests.

## Usage

```
/add-patient-context-to-tests tests/nightwatch/honeycomb/crud.observations.js
```

## What It Does

1. **Adds suite-level patient ID tracking:**
   - `let testPatientId = null;` at suite level

2. **Updates test 01 (setup) with server-side fetch:**
   - Captures patient ID after creation
   - Uses `Meteor.call('patients.findOne')` to fetch from server
   - Sets patient in Session (bypasses subscription limits)

3. **Updates test 02 with Session restoration:**
   - After `browser.url()` (which clears Session)
   - Re-establishes patient context using stored ID

4. **Adds mid-test context re-establishment:**
   - For tests 07-09 that need patient context
   - Uses server-side fetch pattern

5. **Adds debug logging:**
   - Verifies patient context is set correctly
   - Helps troubleshoot "No data" issues

## The Problem This Solves

**Before:**
```javascript
// Test 01: Creates patient, relies on client collection
browser.execute(function() {
  const patient = Patients.findOne({'identifier.value': 'test-123'});
  // ❌ Returns null in CI because of subscription limits (100 records)
  // Patient exists in DB but not in client collection
});

// Test 07: Patient not found, table empty, test fails
```

**After:**
```javascript
// Test 01: Creates patient, uses SERVER method
testPatientId = result.result; // Store ID at suite level

browser.executeAsync(function(patientId, done) {
  Meteor.call('patients.findOne', patientId, function(error, patient) {
    // ✅ Queries DB directly, bypasses subscription limits
    Session.set('selectedPatient', patient);
    done({ success: true });
  });
}, [testPatientId]);

// Test 07: Re-establish context with stored ID
browser.executeAsync(function(patientId, done) {
  Meteor.call('patients.findOne', patientId, function(error, patient) {
    Session.set('selectedPatient', patient);
    done({ success: true });
  });
}, [testPatientId]);
```

## Example Output

```markdown
# Adding Patient Context Management

Target file: `tests/nightwatch/honeycomb/crud.observations.js`

---

## Changes to Apply:

### 1. Suite-Level Variable (Line ~8)

**Add after timestamp:**
```javascript
describe('Observations CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // ← ADD THIS
```

---

### 2. Test 01 - Capture Patient ID (Line ~67)

**Update patient creation callback:**
```javascript
testUtils.createTestPatient(browser, {
  // ... patient data
}, function(result) {
  testPatientId = result.result; // ← ADD THIS
  console.log('Created patient with ID:', testPatientId);

  // Then fetch from server and set in Session
  browser.executeAsync(function(patientId, done) {
    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('[Test 01] Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('[Test 01] Set patient in Session:', patient._id);
          done({ success: true });
        } else {
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [result.result]);
});
```

---

### 3. Test 02 - Restore Session After browser.url() (Line ~102)

**Add after browser.url() and waitForElementVisible:**
```javascript
it('02. Verify {resourceType} list page loads', browser => {
  browser
    .url('http://localhost:3000/observations')
    .waitForElementVisible('#observationsPage', 5000);

  // Re-establish patient context (browser.url clears Session)
  browser.executeAsync(function(patientId, done) {
    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('[Test 02] Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('[Test 02] Re-established patient context:', patient._id);
          done({ success: true });
        } else {
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [testPatientId]);

  browser.pause(500); // Let subscription react to new Session value
});
```

---

### 4. Test 07 - Re-establish Context (Line ~624)

**Add at start of test 07:**
```javascript
it('07. Update existing observation', browser => {
  // Re-establish patient context
  browser.executeAsync(function(patientId, done) {
    console.log('[Test 07] Re-establishing patient context with ID:', patientId);

    if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
      Meteor.call('patients.findOne', patientId, function(error, patient) {
        if (error) {
          console.error('[Test 07] Error fetching patient:', error);
          done({ success: false, error: error.message });
        } else if (patient) {
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          console.log('[Test 07] Re-established patient context:', patient._id);
          done({ success: true, patientId: patient._id });
        } else {
          console.error('[Test 07] Patient not found:', patientId);
          done({ success: false, error: 'Patient not found' });
        }
      });
    } else {
      done({ success: false, error: 'Meteor or Session not available' });
    }
  }, [testPatientId]);

  browser.pause(1000); // Let subscription react

  // ... rest of test
});
```

Repeat for tests 08 and 09 if they interact with filtered data.

---

## Summary

✅ **Suite-level patient ID tracking** - Persists across all tests
✅ **Server-side patient fetch** - Bypasses subscription limits
✅ **Session restoration after browser.url()** - Maintains context
✅ **Mid-test re-establishment** - Ensures context in later tests
✅ **Debug logging** - Troubleshoot "No data" issues

---

Would you like me to apply these changes? [yes/no]
```

## When Applied

The command modifies the test file in place, adding:
1. Suite-level variable
2. Server-side fetch in test 01
3. Session restoration in test 02
4. Context re-establishment in tests 07-09
5. Debug console.log statements

## Testing After Changes

```bash
# Run the updated test
npm test -- tests/nightwatch/honeycomb/crud.observations.js

# Should see in logs:
# Created patient with ID: abc123
# [Test 01] Set patient in Session: abc123
# [Test 02] Re-established patient context: abc123
# [Test 07] Re-establishing patient context with ID: abc123
```

## Why This Pattern Works

**The Problem:** Subscription limits (100-1000 records)
- Synthea generates 100+ patients already in DB
- New test patient exists in DB but isn't in subscribed 100 records
- `Patients.findOne()` only searches client collection → returns `null`
- Session not set → filtered queries return empty

**The Solution:** Server-side Meteor method
- `Meteor.call('patients.findOne', id)` queries MongoDB directly
- Bypasses subscription limits
- Can find ANY patient in DB using exact `_id`
- Guaranteed success using captured ID

## Related Patterns

- Use with `/create-crud-tests` for new tests (includes this pattern)
- See `.claude/rules/anti-patterns/patient-context.md` for full guide
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` lines 672-789

## When to Use

- Existing tests fail with "No data" in CI but pass locally
- Tests work with small DB but fail with 100+ records
- "Patient not found" errors in test logs
- After adding Synthea data to test database
- Before deploying tests to CI environment

---

**Note:** This pattern is CRITICAL for CI reliability with large datasets.
