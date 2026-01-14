# certification/tdd/SELECTOR_MAP.md
# Base EHR Certification - Component & Selector Audit

This document maps each Base EHR certification criterion to its implementation location and documents existing/needed test selectors.

## Status Legend
- ✅ Component exists with selectors
- 🟡 Component exists, needs selectors
- ❌ Component missing or needs creation
- 🔵 API-only (no UI component needed)

---

## Section (a) - Clinical Criteria

### § 170.315(a)(1) - CPOE Medications

**Status:** ✅ Component exists with basic selectors
**Location:** `packages/order-catalog/client/OrderCatalogPage.jsx`
**Existing Test:** `packages/order-catalog/tests/nightwatch/170.315.a.1.test.js`
**BDD File:** `certification/bdd/170.315-a-1-cpoe-medications.feature`

**Current Selectors:**
- None explicitly (basic route check only)

**Needed Selectors:**
```jsx
// OrderCatalogPage.jsx
<Box data-testid="cpoe-medications-page">
  <ToggleButtonGroup data-testid="order-type-selector">
    <ToggleButton value="medications" data-testid="medications-tab">
  <TextField data-testid="medication-search-input">
  <Button data-testid="create-medication-order-button">
  <Table data-testid="medication-orders-table">
    <TableRow data-testid="medication-order-row">
  <TextField data-testid="medication-order-reason-field"> // Optional per criterion
```

**Key Capabilities to Test:**
- Record medication orders
- Change medication orders
- Access medication orders
- Optional "reason for order" field

---

### § 170.315(a)(2) - CPOE Laboratory

**Status:** ✅ Component exists with basic selectors
**Location:** `packages/order-catalog/client/OrderCatalogPage.jsx` (same component, different tab)
**Existing Test:** `packages/order-catalog/tests/nightwatch/170.315.a.2.test.js`
**BDD File:** `certification/bdd/170.315-a-2-cpoe-laboratory.feature`

**Current Selectors:**
- None explicitly (basic route check only)

**Needed Selectors:**
```jsx
<Box data-testid="cpoe-laboratory-page">
  <ToggleButton value="laboratory" data-testid="laboratory-tab">
  <TextField data-testid="laboratory-search-input">
  <Button data-testid="create-lab-order-button">
  <Table data-testid="laboratory-orders-table">
    <TableRow data-testid="lab-order-row">
  <TextField data-testid="lab-order-reason-field"> // Optional per criterion
```

**Key Capabilities to Test:**
- Record laboratory orders
- Change laboratory orders
- Access laboratory orders
- Optional "reason for order" field

---

### § 170.315(a)(3) - CPOE Diagnostic Imaging

**Status:** ✅ Component exists
**Location:** `packages/clinical-lists/tests/nightwatch/170.315.a.3.test.js` (test exists)
**Component Location:** TBD (likely in order-catalog or separate package)
**Existing Test:** `packages/clinical-lists/tests/nightwatch/170.315.a.3.test.js`
**BDD File:** `certification/bdd/170.315-a-3-cpoe-diagnostic-imaging.feature`

**Needed Selectors:**
```jsx
<Box data-testid="cpoe-imaging-page">
  <TextField data-testid="imaging-search-input">
  <Button data-testid="create-imaging-order-button">
  <Table data-testid="imaging-orders-table">
    <TableRow data-testid="imaging-order-row">
  <TextField data-testid="imaging-order-reason-field"> // Optional per criterion
```

**Key Capabilities to Test:**
- Record diagnostic imaging orders
- Change imaging orders
- Access imaging orders
- Optional "reason for order" field

---

### § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks

**Status:** 🟡 Component exists, needs selectors
**Location:** `packages/drug-interactions/client/DrugInteractionCheckerPage.jsx`
**Existing Test:** `packages/drug-interactions/tests/nightwatch/170.315.a.4.test.js`
**BDD File:** `certification/bdd/170.315-a-4-drug-interactions.feature`

**Needed Selectors:**
```jsx
<Box data-testid="drug-interactions-page">
  <TextField data-testid="drug-search-input">
  <Button data-testid="check-interactions-button">
  <Box data-testid="interaction-results">
    <Alert data-testid="drug-drug-interaction-alert">
    <Alert data-testid="drug-allergy-interaction-alert">
  <Select data-testid="severity-level-select">
  <Box data-testid="intervention-display">
  <Box data-testid="interaction-source-attribution">
```

**Key Capabilities to Test:**
- Drug-drug interaction checking
- Drug-allergy interaction checking
- Severity level adjustment
- Intervention display
- Source attribution (for a-9 integration)

---

### § 170.315(a)(5) - Demographics

**Status:** 🟡 Component exists, needs USCDI v5 selectors
**Location:** `imports/ui-fhir/patients/PatientDetail.jsx`
**Existing Test:** `packages/drug-formulary/tests/nightwatch/170.315.a.5.test.js` (NOTE: test is in wrong package)
**BDD File:** `certification/bdd/170.315-a-5-demographics-observations.feature`

**Current Selectors:**
- Likely minimal or none

**Needed Selectors (USCDI v5 Compliance):**
```jsx
<Box data-testid="patient-demographics-page">
  // Basic Demographics
  <TextField data-testid="patient-firstname-field">
  <TextField data-testid="patient-lastname-field">
  <DatePicker data-testid="patient-birthdate-field">
  <Select data-testid="patient-gender-select">

  // USCDI v5 Required Fields
  <Select data-testid="patient-race-select"> // § 170.207(f) OMB/CDC
  <Select data-testid="patient-ethnicity-select"> // § 170.207(f)
  <Select data-testid="patient-language-select"> // § 170.207(g)(2) ISO 639-2
  <Select data-testid="patient-sex-select"> // § 170.207(n) HL7, USCDI v5
  <Select data-testid="patient-gender-identity-select"> // § 170.207(o) USCDI v5
  <Select data-testid="patient-sexual-orientation-select"> // § 170.207(o) USCDI v5
  <TextField data-testid="patient-pronouns-field"> // § 170.207(o) USCDI v5

  // Contact Info
  <TextField data-testid="patient-phone-field">
  <TextField data-testid="patient-email-field">

  // Address
  <TextField data-testid="patient-address-line1-field">
  <TextField data-testid="patient-city-field">
  <TextField data-testid="patient-state-field">
  <TextField data-testid="patient-zip-field">

  // Actions
  <Button data-testid="save-patient-button">
  <Button data-testid="edit-patient-button">
```

**Key Capabilities to Test:**
- Record patient demographics
- USCDI v5 demographics (race, ethnicity, language, sex, gender identity, sexual orientation, pronouns)
- Change demographics
- Access demographics

**Note:** This is critical for Base EHR and needs comprehensive USCDI v5 support

---

### § 170.315(a)(9) - Clinical Decision Support (EXPIRES 2025-01-01)

**Status:** ❌ Component needs implementation or location identification
**Location:** TBD (test exists but may not have real UI)
**Existing Test:** `certification/tdd/base_ehr/170.315.a.9.test.js`
**BDD File:** `certification/bdd/170.315-a-9-clinical-decision-support.feature`

**Needed Selectors:**
```jsx
<Box data-testid="cds-page">
  // CDS Interventions
  <Box data-testid="cds-interventions-list">
    <Box data-testid="cds-intervention-card">

  // Configuration (admin/role-based)
  <Box data-testid="cds-configuration-panel">
  <Button data-testid="cds-config-button">

  // Infobutton (Linked Referential CDS)
  <Button data-testid="infobutton">
  <Box data-testid="context-help">

  // Source Attributes
  <Box data-testid="cds-source-attributes">
    <Typography data-testid="cds-bibliography">
    <Typography data-testid="cds-developer">
    <Typography data-testid="cds-funding-source">
    <Typography data-testid="cds-release-date">

  // Patient Context Triggers
  <Box data-testid="cds-alert">
  <Box data-testid="clinical-alert">
  <Box data-testid="drug-interaction-check">
```

**Key Capabilities to Test:**
- CDS intervention capability exists
- Role-based configuration
- Evidence-based interventions selection
- Linked referential CDS (Infobutton) per § 170.204(b)(3-4)
- Source attributes accessibility
- CDS triggers during user interaction
- Multiple patient data type triggers (problems, meds, allergies, demographics, labs, vitals)

**Note:** Need to identify where CDS UI is located or create it

---

### § 170.315(a)(14) - Implantable Device List

**Status:** ✅ Component exists
**Location:** `packages/implantable-devices/` (assumed based on test location)
**Existing Test:** `packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js`
**BDD File:** `certification/bdd/170.315-a-14-implantable-device-list.feature`

**Needed Selectors:**
```jsx
<Box data-testid="implantable-devices-page">
  <TextField data-testid="device-udi-input">
  <Button data-testid="parse-udi-button">
  <TextField data-testid="device-identifier-field"> // Parsed from UDI
  <TextField data-testid="production-identifier-field"> // Parsed from UDI
  <Button data-testid="query-gudid-button">
  <Box data-testid="gudid-results">
  <Table data-testid="implantable-devices-table">
  <Select data-testid="device-status-select">
```

**Key Capabilities to Test:**
- Record Unique Device Identifiers (UDI)
- Parse Device Identifier and Production Identifiers
- Query GUDID for device information
- Display implantable device list
- Change device status

---

## Section (b) - Care Coordination Criteria

### § 170.315(b)(11) - Decision Support Interventions (REPLACES a-9)

**Status:** ❌ Component needs implementation (replaces a-9)
**Location:** TBD (likely same as a-9)
**Existing Test:** `certification/tdd/base_ehr/170.315.b.11.test.js`
**BDD File:** `certification/bdd/170.315-b-11-decision-support-interventions.feature`

**Needed Selectors:**
```jsx
// All a-9 selectors PLUS:
<Box data-testid="predictive-dsi-panel">
  <Typography data-testid="predictive-algorithm-name">
  <Typography data-testid="risk-score">

<Box data-testid="demographic-transparency-panel">
  <Typography data-testid="demographic-usage-disclosure">

<Box data-testid="intervention-feedback-form">
  <TextField data-testid="feedback-text">
  <Button data-testid="submit-feedback-button">

<Box data-testid="risk-fairness-disclosure">
  <Typography data-testid="algorithm-limitations">
  <Typography data-testid="fairness-evaluation">
```

**Key Capabilities to Test:**
- All a-9 capabilities
- Predictive intervention detection
- Intervention feedback mechanism
- Demographic data usage disclosure
- Source transparency (enhanced)

---

## Section (e) - Patient Engagement Criteria

### § 170.315(e)(1) - View, Download, and Transmit to 3rd Party

**Status:** ❌ Component needs implementation or location identification
**Location:** TBD (test exists but may be placeholder)
**Existing Test:** `certification/tdd/base_ehr/170.315.e.1.test.js`
**BDD File:** `certification/bdd/170.315-e-1-view-download-transmit.feature`

**Needed Selectors:**
```jsx
<Box data-testid="patient-data-view-page">
  // VIEW capability
  <Box data-testid="patient-data-display">
    <Box data-testid="demographics-section">
    <Box data-testid="problems-section">
    <Box data-testid="medications-section">
    <Box data-testid="allergies-section">
    <Box data-testid="lab-results-section">
    <Box data-testid="vitals-section">
    <Box data-testid="procedures-section">
    <Box data-testid="immunizations-section">

  // DOWNLOAD capability
  <Button data-testid="download-data-button">
  <Select data-testid="download-format-select"> // C-CDA or FHIR JSON
  <Typography data-testid="machine-readable-indicator"> // Shows format

  // TRANSMIT capability
  <Button data-testid="transmit-data-button">
  <TextField data-testid="recipient-email-field">
  <Select data-testid="transmission-method-select"> // Encrypted/unencrypted
  <Alert data-testid="unencrypted-warning"> // Risk warning
  <Button data-testid="confirm-unencrypted-button"> // Consent acknowledgment

  // Activity Log
  <Box data-testid="activity-log">
    <Typography data-testid="activity-log-entry">
  <Button data-testid="view-activity-log-button">
```

**Key Capabilities to Test:**
- VIEW: Human-readable health information display
- VIEW: All USCDI data viewable
- DOWNLOAD: Machine-readable format (C-CDA or FHIR)
- DOWNLOAD: All requested data included
- TRANSMIT: Encrypted transmission to 3rd party
- TRANSMIT: Unencrypted with patient consent
- AUDIT: Activity history log

---

## Section (g) - APIs & Services Criteria

### § 170.315(g)(7) - Application Access - Patient Selection

**Status:** 🔵 API-only (smoke test)
**Location:** Server FHIR endpoints (`/server/fhir/`)
**Existing Test:** `certification/tdd/base_ehr/170.315.g.7.smoke.test.js`
**BDD File:** `certification/bdd/170.315-g-7-10-apis.feature`

**Test Approach:**
- API smoke test only
- Verify FHIR metadata endpoint responds
- Verify Patient resource endpoint accessible
- Full certification via Inferno (https://inferno.healthit.gov)

**No UI selectors needed** - API testing only

---

### § 170.315(g)(9) - Application Access - All Data Request

**Status:** 🔵 API-only (smoke test)
**Location:** Server FHIR endpoints (`/server/fhir/`)
**Existing Test:** `certification/tdd/base_ehr/170.315.g.9.smoke.test.js`
**BDD File:** `certification/bdd/170.315-g-9-application-access-all-data.feature`

**Test Approach:**
- API smoke test only
- Verify $everything operation endpoint responds
- Optional DocumentReference endpoint check
- Full certification via Inferno

**No UI selectors needed** - API testing only

---

### § 170.315(g)(10) - Standardized API for Patient and Population Services

**Status:** 🔵 API-only (smoke test)
**Location:** Server FHIR endpoints (`/server/fhir/`)
**Existing Test:** `certification/tdd/base_ehr/170.315.g.10.smoke.test.js`
**BDD File:** `certification/bdd/170.315-g-10-standardized-api.feature`

**Test Approach:**
- API smoke test only
- Verify FHIR R4 metadata endpoint up
- Verify key US Core resources declared
- Optional SMART configuration check
- Full certification via Inferno (most comprehensive)

**No UI selectors needed** - API testing only

---

## Selector Naming Conventions

### Pattern
```
{resource}-{context}-{action}-{element}
```

### Examples
```jsx
// CPOE
data-testid="medication-order-create-button"
data-testid="lab-order-reason-field"
data-testid="imaging-order-list-table"

// Demographics
data-testid="patient-demographics-firstname"
data-testid="patient-demographics-race"
data-testid="patient-demographics-gender-identity"

// CDS
data-testid="cds-intervention-card"
data-testid="cds-source-bibliography"

// Patient Engagement
data-testid="patient-data-download-button"
data-testid="patient-data-transmit-form"
```

### Guidelines
1. Use kebab-case for all selector values
2. Start with resource type (medication, patient, lab, etc.)
3. Add context if needed (order, demographics, etc.)
4. Include action (create, edit, delete, etc.)
5. End with element type (button, field, table, etc.)
6. Keep selectors descriptive but concise

---

## Implementation Priority

### Phase 1: Clinical Core (Highest Priority)
1. **a-5 (Demographics)** - Foundation for all other criteria
   - Add USCDI v5 fields
   - Comprehensive selectors
   - Critical for certification

2. **a-1, a-2 (CPOE Meds & Labs)** - Core clinical functionality
   - Add selectors to OrderCatalogPage
   - Enhance existing tests with BDD scenarios

3. **a-4 (Drug Interactions)** - Clinical safety
   - Add selectors to DrugInteractionCheckerPage
   - Test interaction alerts

### Phase 2: Specialized Clinical
4. **a-3 (CPOE Imaging)** - Identify component location
5. **a-14 (Implantable Devices)** - Add selectors to existing component

### Phase 3: CDS & Patient Engagement
6. **a-9/b-11 (CDS)** - Locate or create CDS UI
7. **e-1 (VDT)** - Locate or create patient portal

### Phase 4: API Enhancement
8. **g-7, g-9, g-10** - Enhance smoke tests with additional BDD scenarios

---

## Next Steps

1. **Add selectors to OrderCatalogPage** (a-1, a-2)
   - Medications tab
   - Laboratory tab
   - Order creation flows

2. **Enhance PatientDetail.jsx** (a-5)
   - Add USCDI v5 fields
   - Add comprehensive selectors
   - Test CRUD operations

3. **Add selectors to DrugInteractionCheckerPage** (a-4)
   - Interaction alerts
   - Severity controls

4. **Identify missing components** (a-9, b-11, e-1)
   - CDS UI location or creation plan
   - Patient data portal location
   - VDT functionality

5. **Create test helpers** (Phase 2)
   - Authentication helper
   - Selector finder helper
   - BDD scenario mapper

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Next Review**: After Phase 1 implementation
