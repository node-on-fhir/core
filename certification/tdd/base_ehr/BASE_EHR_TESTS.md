# certification/tdd/base_ehr/BASE_EHR_TESTS.md
# Base EHR Certification Test Suite

This document maps all 11 required Base EHR certification criteria to their Nightwatch test files and provides execution instructions.

## Overview

**Base EHR Certification** requires **11 core criteria** per the ONC 2015 Edition Cures Update certification program.

⚠️ **IMPORTANT NOTICE - January 2025** ⚠️
Due to government website shutdown, the official Base EHR definition is temporarily unavailable. The last known version (pre-Jan 2025) listed § 170.315(a)(9) as a required criterion. However, **§ 170.315(a)(9) EXPIRED January 1, 2025** and was replaced by § 170.315(b)(11).

**Current Status**:
- **Uncertainty**: Unknown if Base EHR requires a-9 (grandfathered) or b-11 (replacement)
- **Test Coverage**: Both a-9 AND b-11 tests provided
- **Recommendation**: Run both tests until official ONC guidance confirms requirements

**Test Status**: 11 base tests + 1 alternate (b-11) = 12 tests implemented
**Test Locations**: 6 package tests + 6 certification tests (including both a-9 and b-11)

---

## How to Run

### Run All Base EHR Tests
```bash
cd /path/to/honeycomb-public-release
chmod +x certification/tdd/base_ehr/run-base-ehr-tests.sh
./certification/tdd/base_ehr/run-base-ehr-tests.sh
```

### Run Individual Tests
```bash
# Package tests
meteor npm test -- --test packages/order-catalog/tests/nightwatch/170.315.a.1.test.js

# Certification tests
meteor npm test -- --test certification/tdd/base_ehr/170.315.a.9.test.js
```

---

## Section (a) - Clinical Criteria (7 tests)

### 1. § 170.315(a)(1) - CPOE Medications
- **Status**: ✅ Test Exists
- **Location**: `packages/order-catalog/tests/nightwatch/170.315.a.1.test.js`
- **Package**: order-catalog
- **BDD Reference**: `certification/bdd/170.315-a-1-cpoe-medications.feature`
- **Key Tests**:
  - Record medication orders
  - Change medication orders
  - Access medication orders
  - Optional reason for order field

### 2. § 170.315(a)(2) - CPOE Laboratory
- **Status**: ✅ Test Exists
- **Location**: `packages/order-catalog/tests/nightwatch/170.315.a.2.test.js`
- **Package**: order-catalog
- **BDD Reference**: `certification/bdd/170.315-a-2-cpoe-laboratory.feature`
- **Key Tests**:
  - Record laboratory orders
  - Change laboratory orders
  - Access laboratory orders
  - Optional reason for order field

### 3. § 170.315(a)(3) - CPOE Diagnostic Imaging
- **Status**: ✅ Test Exists
- **Location**: `packages/clinical-lists/tests/nightwatch/170.315.a.3.test.js`
- **Package**: clinical-lists
- **BDD Reference**: `certification/bdd/170.315-a-3-cpoe-diagnostic-imaging.feature`
- **Key Tests**:
  - Record diagnostic imaging orders
  - Change imaging orders
  - Access imaging orders
  - Optional reason for order field

### 4. § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks
- **Status**: ✅ Test Exists
- **Location**: `packages/drug-interactions/tests/nightwatch/170.315.a.4.test.js`
- **Package**: drug-interactions
- **BDD Reference**: `certification/bdd/170.315-a-4-drug-interactions.feature`
- **Key Tests**:
  - Drug-drug interaction checking
  - Drug-allergy interaction checking
  - Severity level adjustment
  - Intervention display

### 5. § 170.315(a)(5) - Demographics
- **Status**: ✅ Test Exists
- **Location**: `packages/drug-formulary/tests/nightwatch/170.315.a.5.test.js`
- **Package**: drug-formulary
- **BDD Reference**: `certification/bdd/170.315-a-5-demographics-observations.feature`
- **Key Tests**:
  - Record patient demographics
  - USCDI v5 demographics (race, ethnicity, language, sex, gender identity, sexual orientation, pronouns)
  - Change demographics
  - Access demographics

### 6a. § 170.315(a)(9) - Clinical Decision Support ⚠️ **EXPIRED Jan 1, 2025**
- **Status**: ✅ Test exists (legacy)
- **Location**: `certification/tdd/base_ehr/170.315.a.9.test.js`
- **BDD Reference**: `certification/bdd/170.315-a-9-clinical-decision-support.feature`
- **⚠️ CRITICAL**: This criterion **EXPIRED January 1, 2025** per 45 CFR § 170.315(a)(9)(vi)
- **Replacement**: § 170.315(b)(11) - Decision Support Interventions
- **⚠️ UNCERTAINTY**: Due to government website shutdown (Jan 2025), it is **UNCLEAR** if Base EHR still requires a-9 (grandfathered) or now requires b-11 instead. **Run both tests until official guidance is available.**
- **Key Tests**:
  - CDS interventions during user interaction
  - Role-based configuration
  - Evidence-based interventions selection
  - Linked referential CDS (Infobutton per § 170.204(b)(3-4))
  - Source attributes (bibliographic citation, developer, funding, dates)
  - CDS triggers on clinical data (problems, meds, allergies, demographics, labs, vitals)

### 6b. § 170.315(b)(11) - Decision Support Interventions (REPLACES a-9)
- **Status**: ✅ **NEW TEST CREATED** (likely Base EHR replacement for a-9)
- **Location**: `certification/tdd/base_ehr/170.315.b.11.test.js`
- **BDD Reference**: `certification/bdd/170.315-b-11-decision-support-interventions.feature`
- **⚠️ UNCERTAINTY**: Likely required for Base EHR after Jan 1, 2025, but official guidance unavailable
- **Enhanced Features** (vs a-9):
  - Everything from a-9 PLUS:
  - **Predictive DSI** - AI/ML algorithms for risk prediction
  - **Demographic transparency** - Must disclose use of race, ethnicity, sex, etc.
  - **Intervention feedback** - Electronic feedback mechanism
  - **Risk & fairness disclosures** - For predictive algorithms
- **Key Tests**:
  - All a-9 capabilities
  - Predictive intervention detection
  - Intervention feedback mechanism
  - Demographic data usage disclosure
  - Source transparency (enhanced)

### 7. § 170.315(a)(14) - Implantable Device List
- **Status**: ✅ Test Exists
- **Location**: `packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js`
- **Package**: implantable-devices
- **BDD Reference**: `certification/bdd/170.315-a-14-implantable-device-list.feature`
- **Key Tests**:
  - Record Unique Device Identifiers (UDI)
  - Parse Device Identifier and Production Identifiers
  - Query GUDID for device information
  - Display implantable device list
  - Change device status

---

## Section (e) - Patient Engagement (1 test)

### 8. § 170.315(e)(1) - View, Download, and Transmit to 3rd Party
- **Status**: ✅ **NEW TEST CREATED**
- **Location**: `certification/tdd/base_ehr/170.315.e.1.test.js`
- **BDD Reference**: `certification/bdd/170.315-e-1-view-download-transmit.feature`
- **Key Tests**:
  - VIEW: Human-readable health information display
  - VIEW: All USCDI data viewable
  - DOWNLOAD: Machine-readable format (C-CDA or FHIR)
  - DOWNLOAD: All requested data included
  - TRANSMIT: Encrypted transmission to 3rd party
  - TRANSMIT: Unencrypted with patient consent
  - AUDIT: Activity history log

---

## Section (g) - APIs & Services (3 tests)

### 9. § 170.315(g)(7) - Application Access - Patient Selection
- **Status**: ✅ **NEW TEST CREATED**
- **Location**: `certification/tdd/base_ehr/170.315.g.7.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-7-10-apis.feature`
- **Test Scope**: Basic endpoint verification (FHIR API up, Patient endpoint responds)
- **⚠️ Note**: **Full certification testing performed by Inferno** (https://inferno.healthit.gov)
- **Key Tests**:
  - FHIR metadata endpoint responds
  - Patient resource endpoint accessible

### 10. § 170.315(g)(9) - Application Access - All Data Request
- **Status**: ✅ **NEW TEST CREATED**
- **Location**: `certification/tdd/base_ehr/170.315.g.9.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-9-application-access-all-data.feature`
- **Test Scope**: Basic endpoint verification ($everything responds)
- **⚠️ Note**: **Full certification testing performed by Inferno** (https://inferno.healthit.gov)
- **Key Tests**:
  - $everything operation endpoint responds
  - DocumentReference endpoint check (optional)

### 11. § 170.315(g)(10) - Standardized API for Patient and Population Services
- **Status**: ✅ **NEW TEST CREATED**
- **Location**: `certification/tdd/base_ehr/170.315.g.10.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-10-standardized-api.feature`
- **Test Scope**: Basic FHIR R4 endpoint verification
- **⚠️ Note**: **Full certification testing performed by Inferno** (https://inferno.healthit.gov)
- **Inferno Tests**:
  - § 170.215(a) - FHIR R4 conformance
  - § 170.215(b)(1) - US Core Implementation Guide
  - § 170.215(b)(1) - SMART App Launch (OAuth 2.0)
  - § 170.215(c) - OpenID Connect Core
  - § 170.215(d) - SMART Backend Services (Bulk FHIR)
  - § 170.213 - USCDI data classes
  - All mandatory & must-support elements
  - Patient/user/system scopes
  - Refresh tokens (≥3 months)
  - Patient authorization revocation (≤1 hour)
  - Token introspection
- **Our Nightwatch Tests** (dev/CI only):
  - FHIR R4 metadata endpoint up
  - Key US Core resources declared
  - SMART configuration check (optional)

---

## Test Execution Order

The test runner script executes tests in this order:

1. **Phase 1**: Clinical Data Entry (a-1, a-2, a-3, a-4, a-5)
2. **Phase 2**: Clinical Safety (a-14, a-9)
3. **Phase 3**: Patient Engagement (e-1)
4. **Phase 4**: API Infrastructure (g-7, g-9, g-10)

This order ensures foundational capabilities are tested before dependent features.

---

## Certification Requirements Summary

### Mandatory for Base EHR
All 11 criteria are **MANDATORY** for Base EHR certification.

### Key Standards Referenced
- **FHIR R4**: § 170.215(a)
- **US Core**: § 170.215(b)(1)
- **SMART on FHIR**: § 170.215(b)(1), (c)
- **Bulk Data (FHIR)**: § 170.215(d)
- **USCDI**: § 170.213
- **C-CDA**: § 170.205(a)(4)
- **OAuth 2.0**: § 170.215(c)
- **Infobutton**: § 170.204(b)(3-4)

### Important Dates
- **January 1, 2025**: § 170.315(a)(9) - Clinical Decision Support **EXPIRES**
  - Use § 170.315(b)(11) - Decision Support Interventions instead

---

## Test Coverage Metrics

### By Implementation Status
- **Package Tests (Existing)**: 6 tests
  - a-1, a-2, a-3 (order-catalog, clinical-lists)
  - a-4 (drug-interactions)
  - a-5 (drug-formulary)
  - a-14 (implantable-devices)

- **Certification Tests (New)**: 5 tests
  - a-9 (Clinical Decision Support)
  - e-1 (View, Download, Transmit)
  - g-7 (Patient Selection API)
  - g-9 (All Data Request API)
  - g-10 (Standardized API)

### By Complexity
- **Simple**: a-1, a-2, a-3 (CPOE - basic CRUD)
- **Moderate**: a-4, a-5, a-14, a-9, e-1 (data validation, external APIs)
- **Complex**: g-7, g-9, g-10 (FHIR APIs, OAuth, SMART, Bulk Data)

---

## Inferno Testing for API Criteria (g-7, g-9, g-10)

**Inferno** is the official ONC-approved testing tool for comprehensive API certification testing. Use Inferno for official certification of § 170.315(g)(7), (g)(9), and (g)(10).

### What is Inferno?

Inferno is an open-source testing tool that validates FHIR-based APIs against ONC certification requirements. It is maintained by the ONC and provides the authoritative test suite for API criteria.

**Website**: https://inferno.healthit.gov

### When to Use Each Tool

| Tool | Purpose | Scope | When to Use |
|------|---------|-------|-------------|
| **Nightwatch** | Development smoke tests | Basic endpoint verification | During development, in CI/CD pipeline |
| **Inferno** | Certification testing | Complete FHIR/US Core/SMART validation | For official ONC certification |

### Inferno Test Suites

Inferno provides separate test suites for each API criterion:

1. **§ 170.315(g)(7) - Patient Selection**
   - Patient resource endpoint
   - Search capabilities
   - Patient identification

2. **§ 170.315(g)(9) - All Data Request**
   - $everything operation
   - USCDI data completeness
   - C-CDA format support
   - Date filtering

3. **§ 170.315(g)(10) - Standardized API** (Most Comprehensive)
   - FHIR R4 conformance (§ 170.215(a))
   - US Core Implementation Guide (§ 170.215(b)(1))
   - SMART App Launch (§ 170.215(b)(1))
   - OAuth 2.0 / OpenID Connect (§ 170.215(c))
   - SMART Backend Services / Bulk FHIR (§ 170.215(d))
   - All USCDI data classes (§ 170.213)
   - Mandatory & must-support elements
   - Patient/user/system scopes
   - Refresh tokens (≥3 months validity)
   - Token introspection
   - Patient authorization revocation (≤1 hour)

### Running Inferno

1. **Access Inferno**: https://inferno.healthit.gov
2. **Select Test Suite**: Choose appropriate ONC certification criteria
3. **Configure Endpoints**: Point to your FHIR server (e.g., http://localhost:3000/baseR4)
4. **Run Tests**: Execute the comprehensive test suite
5. **Review Results**: Address any failures
6. **Generate Report**: Export results for ONC submission

### Inferno vs Nightwatch

Our Nightwatch tests are **not** a replacement for Inferno. They serve different purposes:

**Nightwatch Tests**:
- ✓ Fast feedback during development
- ✓ CI/CD integration
- ✓ Verify endpoints are up before running Inferno
- ✗ Not comprehensive enough for certification

**Inferno Tests**:
- ✓ Official ONC certification testing
- ✓ Comprehensive FHIR/US Core validation
- ✓ SMART authorization flow testing
- ✓ Required for certification submission
- ✗ Slower, more complex setup

**Recommended Workflow**:
1. Develop features
2. Run Nightwatch tests to verify basic functionality
3. Fix any endpoint issues
4. Run Inferno for comprehensive validation
5. Address Inferno findings
6. Submit Inferno results for certification

---

## Troubleshooting

### Common Issues

**Test fails: "No patients found"**
- Ensure test database has sample patient data
- Check Meteor.call('test.createTestPatient') method exists

**API tests fail: "FHIR endpoint not found"**
- Verify FHIR server is running on http://localhost:3000/baseR4
- Check Meteor settings for FHIR server configuration

**SMART tests fail: ".well-known/smart-configuration not found"**
- Verify OAuth server is configured
- Check for SMART on FHIR package installation

**Authentication errors**
- Verify test user creation methods exist
- Check Roles package is installed for role-based tests

### Test Execution Tips

1. **Run sequentially first**: Don't run all tests in parallel initially
2. **Check screenshots**: Review test screenshots in `tests/screenshots/`
3. **Monitor console**: Watch for detailed test output and verification logs
4. **Database state**: Ensure clean database state between runs if needed

---

## Related Documentation

- **BDD Scenarios**: `/certification/bdd/*.feature`
- **Implementation Order**: `/certification/bdd/IMPLEMENTATION_ORDER.md`
- **Test Stubs**: `/certification/tdd/STUBS.MD`
- **Package Development**: `/packages/CLAUDE.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-01-21
**ONC Program**: 2015 Edition Cures Update
**Certification Level**: Base EHR (11 of 11 core criteria)
