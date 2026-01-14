# certification/tdd/STUBS.MD
# Existing TDD Test Stubs

This document lists the ONC Health IT Certification criteria that currently have Nightwatch test stubs implemented in the codebase.

## Overview

**Total Test Files**: 30 Nightwatch test files
**Pattern**: `packages/*/tests/nightwatch/*.test.js`

---

## Section (a) - Clinical

### � 170.315(a)(1) - CPOE Medications
- **Package**: order-catalog
- **Test File**: `packages/order-catalog/tests/nightwatch/170.315.a.1.test.js`

### � 170.315(a)(2) - CPOE Laboratory
- **Package**: order-catalog
- **Test File**: `packages/order-catalog/tests/nightwatch/170.315.a.2.test.js`

### � 170.315(a)(3) - CPOE Diagnostic Imaging
- **Package**: clinical-lists
- **Test File**: `packages/clinical-lists/tests/nightwatch/170.315.a.3.test.js`

### � 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks
- **Package**: drug-interactions
- **Test File**: `packages/drug-interactions/tests/nightwatch/170.315.a.4.test.js`

### � 170.315(a)(5) - Demographics
- **Package**: drug-formulary
- **Test File**: `packages/drug-formulary/tests/nightwatch/170.315.a.5.test.js`

### � 170.315(a)(10) - Drug Formulary and Preferred Drug List (RESERVED)
- **Package**: e-prescribing
- **Test File**: `packages/e-prescribing/tests/nightwatch/170.315.a.10.test.js`
- **Note**: This criterion is RESERVED in regulations

### � 170.315(a)(11) - Smoking Status (RESERVED)
- **Package**: symptom-tracking
- **Test File**: `packages/symptom-tracking/tests/nightwatch/170.315.a.11.test.js`
- **Note**: This criterion is RESERVED in regulations

### � 170.315(a)(12) - Family Health History
- **Package**: family-health-history
- **Test File**: `packages/family-health-history/tests/nightwatch/170.315.a.12.test.js`

### � 170.315(a)(14) - Implantable Device List
- **Package**: implantable-devices
- **Test File**: `packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js`

### � 170.315(a)(15) - Social Determinants of Health
- **Package**: social-determinants
- **Test File**: `packages/social-determinants/tests/nightwatch/170.315.a.15.test.js`

### � 170.315(a)(18) - Structured Data Capture (RESERVED)
- **Package**: structured-data-capture
- **Test File**: `packages/structured-data-capture/tests/nightwatch/170.315.a.18.test.js`
- **Note**: This criterion is RESERVED in regulations

---

## Section (b) - Care Coordination

### � 170.315(b)(1) - Transitions of Care
- **Package**: pacio-core
- **Test File**: `packages/pacio-core/tests/nightwatch/170.315.b.1.test.js`

### � 170.315(b)(2) - Clinical Information Reconciliation and Incorporation
- **Package**: pacio-core
- **Test File**: `packages/pacio-core/tests/nightwatch/170.315.b.2.test.js`

### � 170.315(b)(6) - Data Portability (RESERVED)
- **Package**: data-exporter
- **Test File**: `packages/data-exporter/tests/nightwatch/170.315.b.6.test.js`
- **Note**: This criterion is RESERVED in regulations

### � 170.315(b)(8) - Security Tags - Summary of Care - Receive
- **Package**: secure-messaging
- **Test File**: `packages/secure-messaging/tests/nightwatch/170.315.b.8.test.js`

---

## Section (d) - Privacy & Security

### � 170.315(d)(1) - Authentication, Access Control, Authorization
- **Package**: accounts-management
- **Test Files**:
  - `packages/accounts-management/tests/nightwatch/170.315.d.1.test.js`
  - `packages/accounts-management/tests/nightwatch/170.315.d.1.simple.test.js`
- **Also in**: hipaa-compliance
  - `packages/hipaa-compliance/tests/nightwatch/170.315.d.1.test.js`

### � 170.315(d)(4) - Amendments
- **Package**: request-for-corrections
- **Test File**: `packages/request-for-corrections/tests/nightwatch/170.315.d.4.test.js`

### � 170.315(d)(13) - Multi-Factor Authentication
- **Package**: multi-factor-auth
- **Test File**: `packages/multi-factor-auth/tests/nightwatch/170.315.d.13.test.js`

---

## Section (e) - Patient Engagement

### � 170.315(e)(3) - Patient Health Data Capture
- **Package**: pacio-core
- **Test File**: `packages/pacio-core/tests/nightwatch/170.315.e.3.test.js`

---

## Section (f) - Public Health

### � 170.315(f)(1) - Transmission to Immunization Registries
- **Package**: immunization-registry
- **Test File**: `packages/immunization-registry/tests/nightwatch/170.315.f.1.test.js`

### � 170.315(f)(2) - Transmission to Public Health Agencies - Syndromic Surveillance
- **Package**: syndromic-surveillance
- **Test File**: `packages/syndromic-surveillance/tests/nightwatch/170.315.f.2.test.js`

### � 170.315(f)(3) - Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results
- **Package**: lab-test-reporting
- **Test File**: `packages/lab-test-reporting/tests/nightwatch/170.315.f.3.test.js`

### � 170.315(f)(4) - Transmission to Cancer Registries
- **Package**: cancer-registry-reporting
- **Test File**: `packages/cancer-registry-reporting/tests/nightwatch/170.315.f.4.test.js`

### � 170.315(f)(5) - Electronic Case Reporting
- **Package**: case-reporting
- **Test File**: `packages/case-reporting/tests/nightwatch/170.315.f.5.test.js`

### � 170.315(f)(6) - Antimicrobial Use and Resistance Reporting
- **Package**: antimicrobial-reporting
- **Test File**: `packages/antimicrobial-reporting/tests/nightwatch/170.315.f.6.test.js`

---

## Section (g) - Design & Performance

### � 170.315(g)(1) - Automated Numerator Recording (RESERVED)
- **Package**: quality-measures
- **Test File**: `packages/quality-measures/tests/nightwatch/170.315.g.1.test.js`
- **Note**: This criterion is RESERVED in regulations

### � 170.315(g)(2) - Automated Measure Calculation (RESERVED)
- **Package**: quality-measures
- **Test File**: `packages/quality-measures/tests/nightwatch/170.315.g.2.test.js`
- **Note**: This criterion is RESERVED in regulations

### � 170.315(g)(6) - Consolidated CDA Creation Performance
- **Package**: ccda-export
- **Test File**: `packages/ccda-export/tests/nightwatch/170.315.g.6.test.js`

---

## Base EHR Certification Tests (NEW)

### § 170.315(a)(9) - Clinical Decision Support (EXPIRES Jan 1, 2025)
- **Test File**: `certification/tdd/base_ehr/170.315.a.9.test.js`
- **BDD Reference**: `certification/bdd/170.315-a-9-clinical-decision-support.feature`
- **Note**: Created for Base EHR certification; this criterion expires January 1, 2025

### § 170.315(e)(1) - View, Download, and Transmit to 3rd Party
- **Test File**: `certification/tdd/base_ehr/170.315.e.1.test.js`
- **BDD Reference**: `certification/bdd/170.315-e-1-view-download-transmit.feature`
- **Note**: Created for Base EHR certification

### § 170.315(g)(7) - Application Access - Patient Selection
- **Test File**: `certification/tdd/base_ehr/170.315.g.7.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-7-10-apis.feature`
- **Note**: Created for Base EHR certification

### § 170.315(g)(9) - Application Access - All Data Request
- **Test File**: `certification/tdd/base_ehr/170.315.g.9.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-9-application-access-all-data.feature`
- **Note**: Created for Base EHR certification

### § 170.315(g)(10) - Standardized API for Patient and Population Services
- **Test File**: `certification/tdd/base_ehr/170.315.g.10.test.js`
- **BDD Reference**: `certification/bdd/170.315-g-10-standardized-api.feature`
- **Note**: Created for Base EHR certification; most comprehensive API test

---

## Coverage Analysis

### Criteria with Test Stubs (35 total)
- Section (a): 12 test files (5 are RESERVED criteria, 1 NEW)
- Section (b): 4 test files (1 is RESERVED)
- Section (d): 3 test files (3 packages)
- Section (e): 2 test files (1 NEW)
- Section (f): 6 test files
- Section (g): 8 test files (2 are RESERVED, 3 NEW)

### Active Criteria with Test Stubs (27 total)
After removing RESERVED criteria (a-10, a-11, a-18, b-6, g-1, g-2), there are 27 active test files.

**NEW**: 5 Base EHR tests added in `certification/tdd/base_ehr/` (a-9, e-1, g-7, g-9, g-10)

### Missing Test Stubs
The following active criteria do NOT have test stubs yet:

**Section (b) - Care Coordination**
- § 170.315(b)(3) - Electronic Prescribing
- § 170.315(b)(7) - Security Tags - Summary of Care - Send
- § 170.315(b)(9) - Care Plan
- § 170.315(b)(10) - Electronic Health Information Export
- § 170.315(b)(11) - Decision Support Interventions

**Section (c) - Clinical Quality Measures**
- § 170.315(c)(1) - CQM - Record and Export
- § 170.315(c)(2) - CQM - Import and Calculate
- § 170.315(c)(3) - CQM - Report
- § 170.315(c)(4) - CQM - Filter

**Section (d) - Privacy & Security**
- § 170.315(d)(2) - Auditable Events and Tamper-Resistance
- § 170.315(d)(3) - Audit Report
- § 170.315(d)(5) - Automatic Access Time-out
- § 170.315(d)(6) - Emergency Access
- § 170.315(d)(7) - End-User Device Encryption
- § 170.315(d)(8) - Integrity
- § 170.315(d)(9) - Trusted Connection
- § 170.315(d)(10) - Auditing Actions on Health Information
- § 170.315(d)(11) - Accounting of Disclosures
- § 170.315(d)(12) - Encrypt Authentication Credentials

**Section (e) - Patient Engagement**
- § 170.315(e)(2) - Secure Messaging

**Section (f) - Public Health**
- § 170.315(f)(7) - Health Care Surveys

**Section (g) - Design & Performance**
- § 170.315(g)(3) - Safety-Enhanced Design
- § 170.315(g)(4) - Quality Management System
- § 170.315(g)(5) - Accessibility-Centered Design
- § 170.315(g)(8) - Application Access - Data Category Request

**Section (h) - Transport**
- § 170.315(h)(1) - Direct Project
- § 170.315(h)(2) - Transport Protocols

---

**Total Active Criteria**: 51
**Test Stubs Implemented**: 27 (53%)
**Test Stubs Needed**: 24 (47%)

**Recent Additions** (2025-01-21): 5 Base EHR tests created in `certification/tdd/base_ehr/`

---

**Document Version**: 1.1
**Last Updated**: 2025-01-21
**Sources**:
- File system scan of `packages/*/tests/nightwatch/*.test.js`
- Base EHR tests in `certification/tdd/base_ehr/*.test.js`
