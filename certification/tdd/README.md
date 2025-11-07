# certification/tdd/README.md
# ONC Health IT Certification - TDD Test Suite

## Overview

This directory contains Test-Driven Development (TDD) tests for ONC Health IT Certification criteria, translated from BDD (Behavior-Driven Development) feature files.

## Directory Structure

```
certification/tdd/
├── README.md                          # This file
├── SELECTOR_MAP.md                    # Component & selector audit
├── BDD_TO_TDD_WORKFLOW.md            # Translation workflow guide
├── base_ehr/                          # Base EHR certification tests
│   ├── 170.315.a.9.test.js           # CDS (expires 2025-01-01)
│   ├── 170.315.b.11.test.js          # Decision Support Interventions
│   ├── 170.315.e.1.test.js           # View, Download, Transmit
│   ├── 170.315.g.7.smoke.test.js     # API - Patient Selection
│   ├── 170.315.g.9.smoke.test.js     # API - All Data Request
│   ├── 170.315.g.10.smoke.test.js    # API - Standardized API
│   ├── BASE_EHR_TESTS.md             # Base EHR test inventory
│   └── run-base-ehr-tests.sh         # Test runner script
├── helpers/                           # Reusable test helpers
│   ├── authentication-helper.js       # Login/auth utilities
│   ├── selector-helper.js             # Element finding utilities
│   └── bdd-mapper.js                  # BDD-to-TDD mapping
└── templates/                         # Test templates
    └── test-template.js               # Template for new tests
```

## Quick Start

### Running Tests

```bash
# Run all Base EHR tests
cd /path/to/honeycomb-ehr
./certification/tdd/base_ehr/run-base-ehr-tests.sh

# Run individual test
npm test -- certification/tdd/base_ehr/170.315.a.9.test.js

# Run with verbose output
npm test -- certification/tdd/base_ehr/170.315.e.1.test.js --verbose

# Run specific package test
npm test -- packages/order-catalog/tests/nightwatch/170.315.a.1.test.js
```

### Creating New Tests

1. **Read BDD file**: `certification/bdd/170.315-X-Y-[name].feature`
2. **Copy template**: `cp templates/test-template.js base_ehr/170.315.X.Y.test.js`
3. **Customize**: Replace placeholders, add selectors
4. **Run test**: `npm test -- base_ehr/170.315.X.Y.test.js`
5. **Document**: Update `BASE_EHR_TESTS.md`

See [BDD_TO_TDD_WORKFLOW.md](BDD_TO_TDD_WORKFLOW.md) for detailed instructions.

## Base EHR Certification

**Required Criteria**: 11 core criteria (per ONC 2015 Edition Cures Update)

### Section (a) - Clinical Criteria (7 tests)
1. ✅ § 170.315(a)(1) - CPOE Medications
2. ✅ § 170.315(a)(2) - CPOE Laboratory
3. ✅ § 170.315(a)(3) - CPOE Diagnostic Imaging
4. ✅ § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks
5. ✅ § 170.315(a)(5) - Demographics
6. ⚠️ § 170.315(a)(9) - Clinical Decision Support (EXPIRES 2025-01-01)
7. ✅ § 170.315(a)(14) - Implantable Device List

### Section (b) - Care Coordination (1 test)
- ✅ § 170.315(b)(11) - Decision Support Interventions (replaces a-9)

### Section (e) - Patient Engagement (1 test)
- ✅ § 170.315(e)(1) - View, Download, and Transmit to 3rd Party

### Section (g) - APIs & Services (3 tests)
- 🔵 § 170.315(g)(7) - Application Access - Patient Selection (API smoke test)
- 🔵 § 170.315(g)(9) - Application Access - All Data Request (API smoke test)
- 🔵 § 170.315(g)(10) - Standardized API (API smoke test)

**Legend**:
- ✅ Test exists (package or certification directory)
- ⚠️ Test exists but criterion expired
- 🔵 API-only test (comprehensive testing via Inferno)

**Note**: Full API certification testing is performed by Inferno (https://inferno.healthit.gov). Our smoke tests verify basic endpoint availability only.

## Test Helpers

### Authentication Helper

```javascript
const { loginAsProvider, loginAsPatient, loginAsAdmin } = require('./helpers/authentication-helper');

// In test
loginAsProvider(browser);  // Login as clinical user
loginAsPatient(browser);   // Login as patient
loginAsAdmin(browser);     // Login as administrator
```

### Selector Helper

```javascript
const {
  verifyPageLoaded,
  verifyPageContent,
  takeScreenshot,
  logTestCompletion,
  assertElementExists,
  verifyCapability
} = require('./helpers/selector-helper');

// Verify page loads successfully
verifyPageLoaded(browser, '170.315.a.1');

// Verify key capability exists
verifyCapability(browser, {
  selectors: ['[data-testid="capability"]', '#capabilityId'],
  criterion: '170.315.a.1',
  capability: 'CPOE Medications interface'
});

// Take screenshot
takeScreenshot(browser, 'test-screenshot.png', '170.315.a.1');

// Log completion with capabilities list
logTestCompletion(browser, '170.315.a.1', 'CPOE Medications', [
  'Page accessibility',
  'Order creation interface',
  'Table display'
]);
```

### BDD Mapper

```javascript
const { mapGiven, mapWhen, mapThen } = require('./helpers/bdd-mapper');

// Map BDD scenarios to Nightwatch commands
const setup = mapGiven('I am authenticated as a provider');
const action = mapWhen('I click the "Create Order" button');
const assertion = mapThen('Then the order shall be saved');
```

## Test Levels

### Level 1: Smoke Test (Current Priority - MVP)
**Goal**: Verify basic functionality exists
**Time**: 15-30 minutes per criterion

- ✅ Page loads (no 404)
- ✅ Key UI elements present
- ✅ No JavaScript errors
- ✅ Screenshot captured

### Level 2: Capability Test
**Goal**: Verify ONC-required capabilities
**Time**: 1-2 hours per criterion

- All required UI elements
- Capability indicators present
- Configuration options available
- Source attribution (if applicable)

### Level 3: Workflow Test (Future)
**Goal**: Test complete user workflows
**Time**: 2-4 hours per criterion

- Create record
- Edit record
- View record
- Delete record
- Error handling

### Level 4: Integration Test (Future)
**Goal**: Test cross-criterion integration
**Time**: Variable

- CDS triggers on medication order
- Demographics used in patient matching
- Data export includes all USCDI

## Selector Conventions

### Naming Pattern
```
{resource}-{context}-{action}-{element}
```

### Examples
```jsx
// CPOE
<Button data-testid="medication-order-create-button">
<TextField data-testid="lab-order-reason-field">
<Table data-testid="imaging-orders-table">

// Demographics
<TextField data-testid="patient-demographics-firstname">
<Select data-testid="patient-demographics-race">
<Select data-testid="patient-demographics-gender-identity">

// CDS
<Box data-testid="cds-interventions-list">
<Button data-testid="infobutton">
<Box data-testid="cds-source-attributes">

// Patient Engagement
<Button data-testid="patient-data-download-button">
<Button data-testid="patient-data-transmit-button">
<Box data-testid="activity-log">
```

### Guidelines
1. Use kebab-case for all selector values
2. Start with resource type (medication, patient, lab, etc.)
3. Add context if needed (order, demographics, etc.)
4. Include action (create, edit, delete, etc.)
5. End with element type (button, field, table, etc.)
6. Keep descriptive but concise

See [SELECTOR_MAP.md](SELECTOR_MAP.md) for complete selector audit.

## Component Locations

### Base EHR Implementations

| Criterion | Component Location | Test Location |
|-----------|-------------------|---------------|
| 170.315(a)(1) | `packages/order-catalog/` | `packages/order-catalog/tests/nightwatch/` |
| 170.315(a)(2) | `packages/order-catalog/` | `packages/order-catalog/tests/nightwatch/` |
| 170.315(a)(3) | `packages/clinical-lists/` | `packages/clinical-lists/tests/nightwatch/` |
| 170.315(a)(4) | `packages/drug-interactions/` | `packages/drug-interactions/tests/nightwatch/` |
| 170.315(a)(5) | `imports/ui-fhir/patients/` | `packages/drug-formulary/tests/nightwatch/` |
| 170.315(a)(9) | TBD (needs location) | `certification/tdd/base_ehr/` |
| 170.315(a)(14) | `packages/implantable-devices/` | `packages/implantable-devices/tests/nightwatch/` |
| 170.315(b)(11) | TBD (replaces a-9) | `certification/tdd/base_ehr/` |
| 170.315(e)(1) | TBD (patient portal) | `certification/tdd/base_ehr/` |
| 170.315(g)(7-10) | `/server/fhir/` (API) | `certification/tdd/base_ehr/` |

## Architecture Notes

### FHIR-Native Approach

**Transitions of Care Strategy:**
- Core transitions use FHIR (PACIO)
- C-CDA only at network boundary
- Import/export via data-importer/exporter packages

```
External System (C-CDA)
    ↓ import via data-importer
FHIR Resources (internal)
    ↓ PACIO transfers (FHIR-native)
FHIR Resources (internal)
    ↓ export via data-exporter
External System (C-CDA)
```

**Benefits:**
- Future-proof for 2026/2028 ONC updates
- Simpler internal data flow
- Better integration with modern APIs

### API Testing Strategy

**Nightwatch Tests** (This directory):
- Smoke tests only
- Verify endpoints respond
- Basic capability checks
- Fast feedback during development

**Inferno Tests** (External):
- Comprehensive FHIR/US Core validation
- SMART authorization flow testing
- OAuth 2.0 / OpenID Connect testing
- Bulk FHIR testing
- Required for official certification

## Troubleshooting

### Common Issues

**"Element not found"**
- Check if selector was added to component
- Verify component is rendered
- Use flexible selectors with fallbacks

**Page returns 404**
- Check route in `imports/ui/App.jsx`
- Verify component is imported
- Check settings module is enabled
- Restart Meteor server

**Authentication fails**
- Verify test methods imported in `server/main.js`
- Check user creation succeeds
- Add debug logging

**Patient filtering not working**
- Use FHIR id, not MongoDB _id
- Verify Session is set properly
- Check FhirUtilities.addPatientFilterToQuery()

See [BDD_TO_TDD_WORKFLOW.md](BDD_TO_TDD_WORKFLOW.md) for detailed troubleshooting.

## Development Workflow

### Adding Selectors (Quality Control)

**Acceptable Changes** ✅:
- Adding `data-testid` attributes
- Adding `id` attributes for test hooks
- Adding `className` for consistency

**Avoid** ❌:
- Changing existing business logic
- Modifying data validation
- Altering user workflows
- Breaking existing functionality

**Validation Process**:
1. Add selectors to component
2. Run existing app tests (if any)
3. Verify UI still works manually
4. Run new Nightwatch test
5. Review screenshot for visual regression
6. Commit changes separately

### Git Workflow

```bash
# Commit selectors separately from tests
git add packages/order-catalog/client/OrderCatalogPage.jsx
git commit -m "feat(order-catalog): add test selectors for ONC 170.315(a)(1)"

# Commit tests separately
git add certification/tdd/base_ehr/170.315.a.1.test.js
git commit -m "test(certification): add enhanced test for ONC 170.315(a)(1)"

# Commit documentation updates
git add certification/tdd/BASE_EHR_TESTS.md
git commit -m "docs(certification): update Base EHR test documentation"
```

## Resources

### Internal Documentation
- [SELECTOR_MAP.md](SELECTOR_MAP.md) - Component and selector audit
- [BDD_TO_TDD_WORKFLOW.md](BDD_TO_TDD_WORKFLOW.md) - Workflow guide
- [BASE_EHR_TESTS.md](base_ehr/BASE_EHR_TESTS.md) - Base EHR test inventory
- [CLAUDE.md](../../CLAUDE.md) - Project-level development guide

### BDD Feature Files
- `certification/bdd/*.feature` - All certification criteria in BDD format
- `certification/bdd/IMPLEMENTATION_ORDER.md` - Dependency tree and phases

### External Resources
- [Inferno](https://inferno.healthit.gov) - Official ONC API testing tool
- [ONC Health IT Certification Program](https://www.healthit.gov/topic/certification-ehrs/certification-health-it) - Official program info
- [45 CFR Part 170](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-D/part-170) - Regulatory text

## Contributing

### Adding a New Test

1. Read the BDD file for the criterion
2. Locate the implementing component
3. Add test selectors to the component
4. Copy and customize the test template
5. Run and validate the test
6. Update documentation
7. Commit changes (selectors and tests separately)

### Enhancing an Existing Test

1. Review BDD file for additional scenarios
2. Identify missing test coverage
3. Add new selectors if needed
4. Enhance test with new scenarios
5. Run and validate
6. Update documentation

### Reporting Issues

Create a GitHub issue with:
- Criterion number (e.g., 170.315.a.1)
- Test file path
- Expected vs actual behavior
- Console output
- Screenshot (if applicable)

## Status Summary

**Completed**:
- ✅ Phase 1: Component and selector audit
- ✅ Phase 2: Test templates and helper functions
- ✅ Documentation (SELECTOR_MAP, BDD_TO_TDD_WORKFLOW)

**In Progress**:
- 🔄 Phase 3: Adding selectors to components (a-1 through a-5)
- 🔄 Phase 4: Enhancing TDD tests for Base EHR

**Planned**:
- 📋 Phase 5: Additional clinical criteria (a-12, a-15)
- 📋 Phase 6: Transitions of care (FHIR-native via PACIO)
- 📋 Phase 7: Full workflow tests (Level 3)
- 📋 Phase 8: Integration tests (Level 4)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Next Review**: After Phase 4 completion

**Maintainers**: Development team
**Questions**: See [BDD_TO_TDD_WORKFLOW.md](BDD_TO_TDD_WORKFLOW.md) for detailed guidance
