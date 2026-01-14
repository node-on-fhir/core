// certification/tdd/BDD_TO_TDD_WORKFLOW.md
# BDD to TDD Workflow Guide

This document provides step-by-step instructions for translating BDD feature files into executable Nightwatch TDD tests.

## Table of Contents
1. [Overview](#overview)
2. [Workflow Steps](#workflow-steps)
3. [Translation Patterns](#translation-patterns)
4. [Component Integration](#component-integration)
5. [Test Levels](#test-levels)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose
Convert Behavior-Driven Development (BDD) scenarios written in Gherkin format (`.feature` files) into Test-Driven Development (TDD) tests using Nightwatch.js.

### Approach
- **MVP First**: Start with minimum viable tests (route accessibility, key elements present)
- **Iterative Enhancement**: Add workflow tests as BDD files mature
- **Quality Focus**: Ensure no breaking changes to business logic
- **Selector-Driven**: Add `data-testid` attributes for reliable testing

### Test Philosophy
```
BDD Feature File → Identify Requirements → Add Selectors → Write TDD Test → Validate
```

---

## Workflow Steps

### Step 1: Read BDD Feature File

**Location**: `certification/bdd/170.315-X-Y-[name].feature`

**Extract**:
1. **Regulatory Text**: Understanding of the ONC requirement
2. **Key Scenarios**: Main user workflows to test
3. **Tags**: Criterion identifiers and categories
4. **Dependencies**: Referenced standards (§ 170.XXX)

**Example**:
```gherkin
# certification/bdd/170.315-a-1-cpoe-medications.feature
@170.315-a-1 @cpoe @medications @clinical
Feature: Computerized Provider Order Entry - Medications

  Scenario: Create a new medication order
    Given I am authenticated as a provider
    And a patient record is selected
    When I create a medication order for "Lisinopril 10mg"
    Then the order shall be recorded in the system
```

**Key Information**:
- Criterion: 170.315(a)(1)
- Category: CPOE, Medications
- User type: Provider
- Key capability: Create medication orders

---

### Step 2: Locate Implementation

**Find the component that implements this functionality:**

```bash
# Search for related components
find packages -name "*[keyword]*" -type f

# Examples:
find packages -name "*order*" -type f
find packages -name "*medication*" -type f
```

**Check existing tests:**
```bash
# Look for existing tests
find . -name "170.315.X.Y*.js" -type f
```

**Document findings:**
- Component location: `packages/order-catalog/client/OrderCatalogPage.jsx`
- Existing test: `packages/order-catalog/tests/nightwatch/170.315.a.1.test.js`
- Current status: Basic route check only, needs enhancement

---

### Step 3: Add Test Selectors

**Review component for existing selectors:**
```jsx
// Check for existing data-testid attributes
grep -r "data-testid" packages/order-catalog/client/
```

**Add missing selectors following conventions:**

```jsx
// BEFORE (no selectors)
<Box>
  <Button onClick={handleCreate}>
    Create Order
  </Button>
  <Table>
    <TableBody>
      {orders.map(order => (
        <TableRow onClick={() => handleClick(order.id)}>
          <TableCell>{order.name}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Box>

// AFTER (with selectors)
<Box data-testid="cpoe-medications-page">
  <Button
    onClick={handleCreate}
    data-testid="create-medication-order-button"
  >
    Create Order
  </Button>
  <Table data-testid="medication-orders-table">
    <TableBody>
      {orders.map(order => (
        <TableRow
          onClick={() => handleClick(order.id)}
          data-testid="medication-order-row"
        >
          <TableCell>{order.name}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Box>
```

**Selector Naming Convention:**
```
{resource}-{context}-{action}-{element}

Examples:
- medication-order-create-button
- lab-order-reason-field
- patient-demographics-firstname
- cds-intervention-card
```

**Commit selectors separately:**
```bash
git add packages/order-catalog/client/OrderCatalogPage.jsx
git commit -m "feat(order-catalog): add test selectors for ONC 170.315(a)(1)"
```

---

### Step 4: Generate TDD Test

**Use the template:**
```bash
cp certification/tdd/templates/test-template.js \
   certification/tdd/base_ehr/170.315.a.1.test.js
```

**Replace placeholders:**
1. Criterion number: `X.Y` → `a.1`
2. Title: `[Criterion Title]` → `CPOE Medications`
3. Route: `[route-path]` → `/cpoe/medications`
4. Page ID: `[pageId]` → `cpoeMedicationsPage`
5. Test IDs: `[page-testid]` → `cpoe-medications-page`

**Map BDD scenarios to tests:**

| BDD Scenario | Test Implementation |
|--------------|---------------------|
| `Given I am authenticated as a provider` | `loginAsProvider(browser)` |
| `When I navigate to CPOE` | `browser.url('http://localhost:3000/cpoe/medications')` |
| `Then the system shall display order form` | `assertElementExists(browser, '[data-testid="medication-order-form"]')` |

---

### Step 5: Write MVP Test

**Focus on essentials:**
1. ✅ Page loads (no 404)
2. ✅ Key elements present
3. ✅ No JavaScript errors
4. ❌ Full workflow (save for later iteration)

**Example MVP Test:**
```javascript
module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.a.1', 'cpoe', 'medications'],

  'CPOE Medications - 170.315(a)(1)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Authenticate
    loginAsProvider(browser);

    // Navigate to page
    browser
      .url('http://localhost:3000/cpoe/medications')
      .waitForElementVisible('body', 3000)
      .pause(1000);

    // Verify page loads
    verifyPageLoaded(browser, '170.315.a.1');

    // Verify key elements
    verifyCapability(browser, {
      selectors: [
        '[data-testid="cpoe-medications-page"]',
        '[data-testid="medication-orders-table"]'
      ],
      criterion: '170.315.a.1',
      capability: 'CPOE Medications interface'
    });

    // Screenshot and complete
    takeScreenshot(browser, 'base-ehr_170.315.a.1_cpoe-medications.png', '170.315.a.1');
    logTestCompletion(browser, '170.315.a.1', 'CPOE Medications', [
      'Page accessibility',
      'Order interface present',
      'Table display'
    ]);

    browser.end();
  }
};
```

---

### Step 6: Run and Validate

**Run the test:**
```bash
npm test -- certification/tdd/base_ehr/170.315.a.1.test.js
```

**Check results:**
1. Test passes ✅
2. Screenshot captured 📸
3. Console logs show verification steps 📋
4. No JavaScript errors in browser ✓

**Fix failures:**
- **404 Error**: Check route configuration in App.jsx
- **Element not found**: Verify selector was added to component
- **Timeout**: Increase wait time or check if page requires data

---

## Translation Patterns

### BDD Given → Nightwatch Setup

| BDD Given | Nightwatch Code |
|-----------|-----------------|
| `Given I am authenticated as a provider` | `loginAsProvider(browser)` |
| `Given I am authenticated as a patient` | `loginAsPatient(browser)` |
| `Given I am on /cpoe/medications` | `browser.url('http://localhost:3000/cpoe/medications')` |
| `Given a patient record is selected` | `// Handle via Session.set in execute()` |
| `Given the patient has active medications` | `// Test data setup via Meteor.call` |

### BDD When → Nightwatch Actions

| BDD When | Nightwatch Code |
|----------|-----------------|
| `When I click the "Create Order" button` | `browser.click('[data-testid="create-order-button"]')` |
| `When I enter "Lisinopril" in the search field` | `browser.setValue('[data-testid="medication-search"]', 'Lisinopril')` |
| `When I submit the form` | `browser.click('button[type="submit"]')` |
| `When CDS is triggered` | `// Verify via element check` |
| `When I navigate to the demographics page` | `browser.url('http://localhost:3000/patients/:id')` |

### BDD Then → Nightwatch Assertions

| BDD Then | Nightwatch Code |
|----------|-----------------|
| `Then the system shall display the order` | `assertElementExists(browser, '[data-testid="order-display"]')` |
| `Then I shall see the medication list` | `verifyCapability(browser, { selectors: [...], capability: '...' })` |
| `Then the order shall be saved` | `// Check database or UI confirmation` |
| `Then source attributes shall be accessible` | `assertElementExists(browser, '[data-testid="source-attributes"]')` |

---

## Component Integration

### Adding Selectors Without Breaking Changes

**Safe Changes** ✅:
```jsx
// Adding data-testid
<TextField data-testid="patient-firstname" {...props} />

// Adding id
<Box id="demographicsPage">

// Adding className
<Button className="save-button" onClick={handleSave}>
```

**Risky Changes** ⚠️:
```jsx
// Changing prop names
value={patientName} → value={patient.name}  // Could break!

// Modifying event handlers
onClick={handleClick} → onClick={newHandler}  // Could break!

// Changing validation logic
if (name) → if (name && name.length > 2)  // Could break!
```

**Testing After Changes:**
1. Run existing app tests (if any)
2. Manually verify UI still works
3. Check console for errors
4. Run new Nightwatch test

---

## Test Levels

### Level 1: Smoke Test (MVP)
**Goal**: Verify basic functionality exists
**Time**: 15-30 minutes per criterion

```javascript
- Page loads (no 404)
- Key UI elements present
- No JavaScript errors
- Screenshot captured
```

### Level 2: Capability Test
**Goal**: Verify ONC-required capabilities exist
**Time**: 1-2 hours per criterion

```javascript
- All required UI elements
- Capability indicators present
- Configuration options available
- Source attribution (if applicable)
```

### Level 3: Workflow Test
**Goal**: Test complete user workflows
**Time**: 2-4 hours per criterion

```javascript
- Create record
- Edit record
- View record
- Delete record
- Error handling
```

### Level 4: Integration Test
**Goal**: Test cross-criterion integration
**Time**: Variable

```javascript
- CDS triggers on medication order
- Demographics used in matching
- Data export includes all USCDI
```

**Current Priority**: Level 1 (Smoke Tests) for Base EHR

---

## Examples

### Example 1: CPOE Medications (170.315.a.1)

**BDD File**: `certification/bdd/170.315-a-1-cpoe-medications.feature`

**Key Scenarios**:
1. Record medication orders
2. Change medication orders
3. Access medication orders
4. Optional reason for order field

**Component**: `packages/order-catalog/client/OrderCatalogPage.jsx`

**Selectors Added**:
```jsx
<Box data-testid="cpoe-medications-page">
  <ToggleButton data-testid="medications-tab" value="medications">
  <TextField data-testid="medication-search-input">
  <Button data-testid="create-medication-order-button">
  <Table data-testid="medication-orders-table">
  <TextField data-testid="medication-order-reason-field">
```

**Test File**: `packages/order-catalog/tests/nightwatch/170.315.a.1.test.js` (enhanced)

**Test Coverage**:
- ✅ Route accessibility
- ✅ Medications tab present
- ✅ Search functionality
- ✅ Create button present
- ✅ Table display
- ✅ Optional reason field

---

### Example 2: Demographics (170.315.a.5)

**BDD File**: `certification/bdd/170.315-a-5-demographics-observations.feature`

**Key Scenarios**:
1. Record patient demographics
2. USCDI v5 demographics (race, ethnicity, language, sex, gender identity, sexual orientation, pronouns)
3. Change demographics
4. Access demographics

**Component**: `imports/ui-fhir/patients/PatientDetail.jsx`

**Selectors Added**:
```jsx
<Box data-testid="patient-demographics-page">
  <TextField data-testid="patient-firstname-field">
  <TextField data-testid="patient-lastname-field">
  <DatePicker data-testid="patient-birthdate-field">
  <Select data-testid="patient-gender-select">
  <Select data-testid="patient-race-select">
  <Select data-testid="patient-ethnicity-select">
  <Select data-testid="patient-language-select">
  <Select data-testid="patient-sex-select">
  <Select data-testid="patient-gender-identity-select">
  <Select data-testid="patient-sexual-orientation-select">
  <TextField data-testid="patient-pronouns-field">
  <Button data-testid="save-patient-button">
```

**Test File**: `certification/tdd/base_ehr/170.315.a.5.test.js` (new or enhanced)

**Test Coverage**:
- ✅ Page accessibility
- ✅ Basic demographics fields
- ✅ USCDI v5 fields present
- ✅ Save functionality
- 🟡 Full CRUD workflow (future)

---

### Example 3: CDS (170.315.a.9)

**BDD File**: `certification/bdd/170.315-a-9-clinical-decision-support.feature`

**Key Scenarios**:
1. CDS interventions during user interaction
2. Role-based configuration
3. Evidence-based interventions selection
4. Linked referential CDS (Infobutton)
5. Source attributes
6. Multiple data type triggers

**Component**: TBD (needs identification or creation)

**Selectors Needed**:
```jsx
<Box data-testid="cds-page">
  <Box data-testid="cds-interventions-list">
  <Box data-testid="cds-configuration-panel">
  <Button data-testid="infobutton">
  <Box data-testid="cds-source-attributes">
  <Alert data-testid="cds-alert">
```

**Test File**: `certification/tdd/base_ehr/170.315.a.9.test.js` (exists, needs real component)

**Current Status**: Placeholder test with hypothetical selectors

**Next Steps**:
1. Identify where CDS UI is/should be
2. Add proper selectors
3. Update test with real implementation

---

## Troubleshooting

### Issue: Test fails with "Element not found"

**Diagnosis**:
```bash
# Check if selector was added to component
grep -r "data-testid=\"your-testid\"" packages/
```

**Solutions**:
1. Verify selector was added to component
2. Check selector spelling (typos)
3. Verify component is actually rendered
4. Check if element is hidden or requires interaction
5. Use multiple fallback selectors

**Fix**:
```javascript
// Instead of single selector
assertElementExists(browser, '[data-testid="element"]')

// Use flexible finder
verifyCapability(browser, {
  selectors: [
    '[data-testid="element"]',
    '#elementId',
    '.element-class'
  ],
  criterion: '170.315.X.Y',
  capability: 'Element description'
});
```

---

### Issue: Page returns 404

**Diagnosis**:
- Route not configured in App.jsx
- Component not imported
- Settings module disabled

**Solutions**:
1. Check `imports/ui/App.jsx` for route
2. Verify component import
3. Check `configs/settings.*.json` for module enable
4. Restart Meteor server

**Fix**:
```jsx
// In App.jsx
import OrderCatalogPage from '../packages/order-catalog/client/OrderCatalogPage';

// In routes
<Route path="/cpoe/medications" element={<OrderCatalogPage />} />
```

---

### Issue: Selector added but test still fails

**Diagnosis**:
- Component not re-compiled
- Wrong settings file loaded
- React component not re-rendered

**Solutions**:
1. Restart Meteor server
2. Clear browser cache
3. Verify correct settings file: `ps aux | grep meteor | grep settings`
4. Check browser console for errors

---

### Issue: Authentication fails

**Diagnosis**:
- Test method not imported on server
- User creation fails silently

**Solutions**:
1. Check `server/main.js` for test methods import:
   ```javascript
   import '../imports/accounts/server/test-methods.js';
   ```

2. Add debug logging:
   ```javascript
   loginAsProvider(browser);
   browser.execute(function() {
     return {
       userId: Meteor.userId(),
       user: Meteor.user()
     };
   }, [], function(result) {
     console.log('User check:', result.value);
   });
   ```

---

### Issue: Patient filtering not working

**Diagnosis**:
- Using MongoDB _id instead of FHIR id
- Session not set properly

**Solutions**:
1. Use FHIR id for filtering:
   ```javascript
   const fhirId = get(selectedPatient, 'id'); // Not _id!
   ```

2. Set Session properly:
   ```javascript
   Session.set('selectedPatientId', patient.id);
   Session.set('selectedPatient', patient);
   ```

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Run single test
npm test -- certification/tdd/base_ehr/170.315.X.Y.test.js

# Run all base EHR tests
./certification/tdd/base_ehr/run-base-ehr-tests.sh

# Run with verbose output
npm test -- certification/tdd/base_ehr/170.315.X.Y.test.js --verbose

# Find components
find packages -name "*keyword*" -type f

# Search for selectors
grep -r "data-testid" packages/package-name/

# Check settings file
ps aux | grep meteor | grep settings
```

### Helper Functions

```javascript
// Authentication
const { loginAsProvider, loginAsPatient, loginAsAdmin } = require('../helpers/authentication-helper');

// Selectors
const {
  verifyPageLoaded,
  verifyPageContent,
  takeScreenshot,
  logTestCompletion,
  assertElementExists,
  verifyCapability
} = require('../helpers/selector-helper');

// BDD Mapping
const { mapGiven, mapWhen, mapThen } = require('../helpers/bdd-mapper');
```

---

## Summary Workflow

```
1. Read BDD file (certification/bdd/170.315-X-Y.feature)
   ↓
2. Locate component (packages/ or imports/)
   ↓
3. Add test selectors (data-testid attributes)
   ↓
4. Copy test template (certification/tdd/templates/test-template.js)
   ↓
5. Customize test (replace placeholders, map scenarios)
   ↓
6. Run test (npm test -- path/to/test.js)
   ↓
7. Fix failures (add selectors, fix routes, handle auth)
   ↓
8. Document (update BASE_EHR_TESTS.md)
   ↓
9. Commit changes (separate commits for selectors and tests)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Next Review**: After first full iteration
