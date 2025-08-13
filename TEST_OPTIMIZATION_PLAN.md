# Test Optimization Plan - Honeycomb (REVISED)

**Last Updated**: 2025-08-12
**Status**: SUCCESSFUL APPROACH IDENTIFIED - Applied to crud.appointments.js

## Summary of Goals
- **Execution Time**: Reduce from ~1 hour to 30-45 minutes (50% reduction)
- **Socket Timeouts**: Fix deprecated `.keys()` API issues ✅
- **Reliability**: Keep existing tests working as-is ✅
- **Maintainability**: NO NEW HELPER FUNCTIONS - work within existing patterns ✅

## Problem Statement
- Tests are timing out on CircleCI after ~1 hour
- Socket hang up errors occurring during `setValue` operations in crud.questionnaires.js
- Tests contain excessive pause() calls (51 in questionnaires test alone)
- Total pause time per test: ~20-25 seconds
- Context deadline exceeded errors in Meteor thread

## Current State Analysis

### Test Performance Issues
1. **crud.questionnaires.js** - Fails at test #6 (View questionnaire details)
   - Error: `POST /session/.../element/.../value - ECONNRESET`
   - Multiple retry attempts fail with socket hang up
   - Using deprecated `.keys()` API which is removed from W3C WebDriver standard

2. **Pause Usage Breakdown** (crud.questionnaires.js):
   - 19 instances of `.pause(100)`
   - 14 instances of `.pause(1000)`
   - 12 instances of `.pause(500)`
   - 5 instances of `.pause(2000)`
   - 1 instance of `.pause(300)`
   - Total: 51 pause calls

3. **Common Anti-patterns Identified**:
   - Fixed pauses after every UI interaction
   - No use of element state verification
   - Redundant pauses in sequences
   - Manual field clearing with multiple backspace operations

## REVISED APPROACH - Simple Optimizations Only

### Key Principles:
1. **DO NOT create new helper functions**
2. **DO NOT change test logic or flow**
3. **ONLY optimize pauses and reduce console logs**
4. **FIX the .keys() deprecation issue**

### 1. Fix Deprecated .keys() API ✅
```javascript
// OLD - Causes socket timeout
.keys([browser.Keys.CONTROL, 'a'])
.keys(browser.Keys.BACK_SPACE)

// NEW - Simple replacement
.click('#field')
.clearValue('#field')
.setValue('#field', newValue)
```

### 2. Pause Reduction Patterns

#### Pattern 1: Reduce multiple small pauses
```javascript
// OLD
.pause(100)
.clearValue()
.pause(100)
.setValue('#title', 'New Value')
.pause(100)

// NEW
.clearValue('#title')
.setValue('#title', 'New Value')
```

#### Pattern 2: Replace long pauses with waitFor
```javascript
// OLD
.click('#saveButton')
.pause(2000)

// NEW
.click('#saveButton')
.waitForElementVisible('#appointmentsTable', 10000)
```

#### Pattern 3: Remove redundant pauses
```javascript
// OLD
.waitForElementVisible('#page', 5000)
.pause(1000)

// NEW
.waitForElementVisible('#page', 5000)
```

### 3. Console Log Reduction

#### Pattern 1: Remove verbose debug logging
```javascript
// OLD
console.log('Initial login state:', result.value);
console.log('Found patient:', patient._id, patient.name?.[0]?.text);
console.log('Form field values after setValue:');
console.log('appointmentType:', document.querySelector('#appointmentTypeInput')?.value);
// ... many more logs

// NEW
// Keep only essential logs for test failures
if (error) {
  console.error('Failed to create patient:', error);
}
```

#### Pattern 2: Consolidate repetitive logs
```javascript
// OLD
console.log('Button text:', button.textContent);
console.log('Clicking Save button');
console.log('Save button clicked');

// NEW
// Just one log if needed
console.log('Saving appointment');
```

## Optimization Approach for Each Test File

### For each CRUD test file:

1. **Fix .keys() deprecation**:
   - Replace `.keys([browser.Keys.COMMAND, 'a']).keys(browser.Keys.BACK_SPACE)` 
   - With: `.clearValue('#field')`

2. **Reduce pauses**:
   - Remove `.pause(100)` between clearValue and setValue
   - Replace `.pause(2000)` after saves with `.waitForElementVisible('#table', 10000)`
   - Remove redundant pauses after waitForElementVisible

3. **Reduce console logs**:
   - Keep only error logs and critical test status logs
   - Remove debug logs showing every field value
   - Consolidate repetitive logging

## Example: crud.appointments.js Optimization

### What to do:
```javascript
// 1. Fix .keys() usage
// OLD
.click('#descriptionInput')
.keys([browser.Keys.COMMAND, 'a'])
.keys(browser.Keys.BACK_SPACE)
.pause(100)
.setValue('#descriptionInput', updatedDescription)

// NEW
.clearValue('#descriptionInput')
.setValue('#descriptionInput', updatedDescription)

// 2. Reduce pauses
// OLD
.click('#saveButton')
.pause(2000)
.waitForElementVisible('#appointmentsTable', 5000)

// NEW
.click('#saveButton')
.waitForElementVisible('#appointmentsTable', 10000)

// 3. Reduce logs
// Remove logs like:
console.log('Form field values after setValue:');
console.log('appointmentType:', document.querySelector('#appointmentTypeInput')?.value);
console.log('description:', document.querySelector('#descriptionInput')?.value);
// Keep only essential error logs
```

## Key Lessons Learned

### 1. What Works:
- **Fixing .keys() deprecation** - Simple clearValue() replacement works perfectly
- **Reducing excessive pauses** - Many 100ms pauses can be removed without issues
- **Consolidating logs** - Less verbose output makes tests easier to debug

### 2. What Doesn't Work:
- **Creating helper functions** - Introduces complexity and new failure modes
- **Changing test flow** - Breaks established patterns that have worked for years
- **Over-optimizing waits** - Some pauses are actually necessary for UI stability

## Implementation Checklist

### For Each Test File:
- [ ] Replace all `.keys()` usage with `.clearValue()`
- [ ] Remove `.pause(100)` between field operations
- [ ] Replace `.pause(2000)` with appropriate `waitForElementVisible()`
- [ ] Remove redundant pauses after wait commands
- [ ] Remove verbose console.log statements
- [ ] Keep only essential error logging
- [ ] Test locally to ensure it still passes

## Success Criteria
1. No socket timeout errors ✅
2. Test execution time reduced by 30-50%
3. Tests still pass reliably
4. Code remains readable and maintainable

## Important Notes
- Some pauses ARE necessary (e.g., after Material-UI select interactions)
- Don't remove ALL logging - keep error logs for debugging
- If a test starts failing after optimization, revert that specific change
- Focus on the biggest wins: removing 100ms pauses and 2000ms waits

## File Status Tracking
| File | Status | Notes |
|------|--------|-------|
| crud.questionnaires.js | ✅ Fixed .keys() | Socket timeout resolved |
| crud.appointments.js | Reverted | Helper functions caused issues - needs simple optimization |
| crud.medias.js | Pending | Next priority |
| crud.schedules.js | Pending | |
| crud.immunizations.js | Pending | |
| crud.allergyintolerances.js | Pending | |
| crud.imagingstudies.js | Pending | |

## Simple Optimization Examples

### 1. Fix .keys() deprecation:
```javascript
// Find all instances of:
.keys([browser.Keys.COMMAND, 'a'])
.keys(browser.Keys.BACK_SPACE)

// Replace with:
.clearValue('#field')
```

### 2. Remove unnecessary pauses:
```javascript
// OLD
.clearValue('#field')
.pause(100)
.setValue('#field', value)
.pause(100)

// NEW
.clearValue('#field')
.setValue('#field', value)
```

### 3. Reduce console logging:
```javascript
// Remove debug logs but keep error logs
// OLD
console.log('Field value:', field.value);
console.log('Setting field to:', newValue);
console.log('Field set successfully');

// NEW
// Just do the operation without logging
```

Last Updated: 2025-08-12