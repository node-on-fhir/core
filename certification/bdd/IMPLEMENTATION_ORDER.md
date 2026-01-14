# certification/bdd/IMPLEMENTATION_ORDER.md
# ONC Health IT Certification Implementation Order & Dependency Tree

This document provides a technology tree showing the implementation order for ONC Health IT Certification criteria based on functional and technical dependencies.

## Overview

The 51 certification criteria have been analyzed for dependencies and organized into 12 implementation tiers. Lower tiers are foundational and required by higher tiers.

**Total Certification Criteria**: 51 feature files
**Total Test Scenarios**: ~370 scenarios
**Implementation Phases**: 12 phases across 12 tiers

---

## Quick Reference: Critical Paths

### Path 1: Basic Clinical Workflow (MVP)
```
d-1, d-2 (Security) → a-5 (Demographics) → a-1, a-2 (CPOE) → a-4 (Drug Safety) → b-10 (Export)
```

### Path 2: Interoperability & Care Coordination
```
Foundation → h-1, h-2 (Transport) → b-1 (C-CDA Exchange) → b-2 (Reconciliation) → b-7, b-8 (Security Tags)
```

### Path 3: API-Based Access (Modern Interoperability)
```
Foundation → All Clinical Data → g-10 (FHIR API) → g-7, g-8, g-9 → e-1 (Patient Access)
```

### Path 4: Public Health Reporting
```
Foundation → Clinical Data → f-1 through f-7 (Independent streams)
```

### Path 5: Quality Measurement
```
Foundation → Clinical Data → c-1 → c-2, c-3, c-4
```

---

## Tier 0: Foundation Layer
**Phase 1 Implementation** | **No Dependencies**

These criteria are foundational - required by nearly all other criteria. Implement first.

### § 170.315(d)(1) - Authentication, Access Control, Authorization
- **File**: `170.315-d-1-authentication-access-control.feature`
- **Scenarios**: 12
- **Why Foundation**: All system access requires authentication and authorization
- **Required By**: Every other criterion
- **Key Capabilities**: User authentication, role-based access control, session management

### § 170.315(d)(2) - Auditable Events and Tamper-Resistance
- **File**: `170.315-d-2-auditable-events.feature`
- **Scenarios**: 8
- **Standards**: § 170.210(e)(1-3) audit logging
- **Why Foundation**: All EHI access must be audited
- **Required By**: All criteria that access/modify EHI
- **Key Capabilities**: Audit log creation, tamper-resistance, audit record retention

### § 170.315(a)(5) - Patient Demographics and Observations
- **File**: `170.315-a-5-demographics-observations.feature`
- **Scenarios**: 31
- **Standards**:
  - § 170.207(f) - Race & Ethnicity (OMB/CDC)
  - § 170.207(g)(2) - Preferred Language (ISO 639-2)
  - § 170.207(n) - Sex (HL7, USCDI v5)
  - § 170.207(o) - Sexual Orientation, Gender Identity, Pronouns
- **Why Foundation**: Patient demographics required for all clinical operations
- **Required By**: b-1 (patient matching), b-2 (reconciliation), a-9/b-11 (CDS), g-10 (USCDI)
- **Key Capabilities**: Record/change/access demographics, USCDI v5 compliance, date of birth, pronouns

---

## Tier 1: Basic Clinical Data Operations
**Phase 2 Implementation** | **Depends on Tier 0**

Core clinical data entry capabilities. Build your clinical database here.

### § 170.315(a)(1) - CPOE Medications
- **File**: `170.315-a-1-cpoe-medications.feature`
- **Scenarios**: 4
- **Depends On**: d-1, d-2, a-5
- **Required By**: a-4 (drug interactions), b-3 (e-prescribing), a-9/b-11 (CDS)
- **Key Capabilities**: Record, change, access medication orders; optional reason field

### § 170.315(a)(2) - CPOE Laboratory
- **File**: `170.315-a-2-cpoe-laboratory.feature`
- **Scenarios**: 4
- **Depends On**: d-1, d-2, a-5
- **Required By**: a-9/b-11 (CDS), f-3 (reportable lab)
- **Key Capabilities**: Record, change, access lab orders; optional reason field

### § 170.315(a)(3) - CPOE Diagnostic Imaging
- **File**: `170.315-a-3-cpoe-diagnostic-imaging.feature`
- **Scenarios**: 4
- **Depends On**: d-1, d-2, a-5
- **Required By**: None (leaf node)
- **Key Capabilities**: Record, change, access imaging orders; optional reason field

### § 170.315(a)(14) - Implantable Device List
- **File**: `170.315-a-14-implantable-device-list.feature`
- **Scenarios**: 17
- **Depends On**: d-1, d-2, a-5
- **External Dependency**: GUDID (Global Unique Device Identification Database)
- **Required By**: b-1 (UDI in transition summaries per "Product Instance")
- **Key Capabilities**: Record UDI, parse DI/PI, query GUDID, display device list, change status

### § 170.315(a)(12) - Family Health History
- **File**: `170.315-a-12-family-health-history.feature`
- **Scenarios**: 7
- **Depends On**: d-1, d-2, a-5
- **Required By**: USCDI (b-1, g-10)
- **Key Capabilities**: Record family health history with relationships and conditions

### § 170.315(a)(15) - Social Determinants of Health (SDOH)
- **File**: `170.315-a-15-sdoh.feature`
- **Scenarios**: 21
- **Depends On**: d-1, d-2, a-5
- **Required By**: USCDI (b-1, g-10)
- **Key Capabilities**: Record SDOH assessments, screenings, interventions, goals

---

## Tier 2: Clinical Safety & Decision Support
**Phase 3 Implementation** | **Depends on Tiers 0-1**

Safety features and clinical decision support require clinical data from Tier 1.

### § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks
- **File**: `170.315-a-4-drug-interactions.feature`
- **Scenarios**: 10
- **Depends On**: a-1 (medication orders), medication list, allergy list, d-1, d-2
- **Required By**: a-9/b-11 (source attributes)
- **Key Capabilities**: Automatic drug-drug checks, automatic drug-allergy checks, severity adjustment

### § 170.315(a)(9) - Clinical Decision Support (EXPIRES Jan 1, 2025)
- **File**: `170.315-a-9-clinical-decision-support.feature`
- **Scenarios**: 23
- **Depends On**: Problem/med/allergy lists, a-5, lab/vitals data, b-2 (reconciliation triggers), a-4
- **Standards**: § 170.204(b)(3-4) for Infobutton
- **Replaced By**: b-11 after January 1, 2025
- **Key Capabilities**: CDS interventions, source attributes, bibliography, Infobutton

### § 170.315(b)(11) - Decision Support Interventions
- **File**: `170.315-b-11-decision-support-interventions.feature`
- **Scenarios**: 26
- **Depends On**: Same as a-9 (replaces a-9 after Jan 1, 2025)
- **Key Capabilities**: Evidence-based CDS, predictive CDS, source attributes, risk management

### § 170.315(b)(9) - Care Plan
- **File**: `170.315-b-9-care-plan.feature`
- **Scenarios**: 11
- **Depends On**: d-1, d-2, a-5, clinical data from Tier 1
- **Required By**: b-1 (care plan in transition summaries)
- **Key Capabilities**: Record, change, access care plans; electronically create care plan document

---

## Tier 3: Transport & Messaging Infrastructure
**Phase 4 Implementation** | **Foundation for Interoperability**

Secure transport mechanisms required for all health information exchange.

### § 170.315(h)(1) - Direct Project
- **File**: `170.315-h-1-direct-project.feature`
- **Scenarios**: 4
- **Standards**:
  - § 170.202(a)(2) - Applicability Statement for Secure Health Transport
  - § 170.202(e)(1) - Delivery Notification
- **Depends On**: d-1, d-2
- **Required By**: b-1 (send/receive TOC), e-2 (secure messaging)
- **Key Capabilities**: Send/receive via Direct SMTP, wrapped messages, delivery notifications

### § 170.315(h)(2) - Transport Protocols (Direct, Edge, XDR/XDM)
- **File**: `170.315-h-2-transport-protocols.feature`
- **Scenarios**: 11
- **Standards**: § 170.202(b), § 170.202(d) - XDR/XDM, SMTP/SOAP edge protocols
- **Depends On**: d-1, d-2
- **Required By**: b-1 (XDM package processing per § 170.205(p)(1))
- **Key Capabilities**: Direct/XDR/XDM send/receive, both edge protocols, metadata profiles

### § 170.315(d)(9) - Trusted Connection
- **File**: `170.315-d-9-trusted-connection.feature`
- **Scenarios**: 2
- **Depends On**: d-1, d-2
- **Required By**: All secure external communications
- **Key Capabilities**: Establish secure connections per § 170.210(c)(1)

---

## Tier 4: Document Exchange (C-CDA)
**Phase 5 Implementation** | **Depends on Tiers 0-3**

C-CDA document creation and exchange - most complex interoperability feature.

### § 170.315(b)(1) - Transitions of Care ⭐ **MOST COMPLEX**
- **File**: `170.315-b-1-transitions-of-care.feature`
- **Scenarios**: 48
- **Major Dependencies**:
  - **§ 170.205(a)(3), (4), (5), (6)** - C-CDA R2.1 (CCD, Referral Note, Discharge Summary)
  - **§ 170.213** - ALL USCDI data classes
  - **§ 170.202(d)** - XDR/XDM transport (h-2)
  - **§ 170.202(a)(2)** - Direct messaging (h-1)
  - **§ 170.205(p)(1)** - XDM package format
  - a-5 (demographics, patient matching data)
  - a-14 (UDI for implantable devices)
  - b-9 (care plan)
  - All clinical data from Tier 1
- **Required By**: b-2, b-7, b-8, e-1, g-6
- **Key Capabilities**:
  - Send/receive TOC summaries via Direct
  - Validate C-CDA conformance
  - Display human-readable format
  - Create CCD/Referral/Discharge with all USCDI data
  - Patient matching data
  - Setting-specific requirements (ambulatory/inpatient)

### § 170.315(b)(2) - Clinical Information Reconciliation and Incorporation
- **File**: `170.315-b-2-clinical-information-reconciliation.feature`
- **Scenarios**: 22
- **Depends On**:
  - b-1 (receives C-CDA per § 170.205(a)(3-5))
  - § 170.213 - USCDI for incorporation
- **Required By**: a-9/b-11 (CDS triggers on reconciled data per § 170.315(b)(2)(iii)(D))
- **System Verification**: Creates CCD per § 170.205(a)(4) after reconciliation
- **Key Capabilities**:
  - Match to correct patient
  - Reconcile medications, allergies, problems
  - Display from multiple sources
  - Automatically update upon confirmation

### § 170.315(b)(7) - Security Tags - Summary of Care - Send
- **File**: `170.315-b-7-security-tags-send.feature`
- **Scenarios**: 8
- **Standards**: § 170.205(o)(1) - DS4P security/privacy tags
- **Depends On**: b-1 (tags C-CDA documents per § 170.205(a)(4))
- **Required By**: b-8
- **Key Capabilities**: Tag at document/section/entry level with restricted/confidential markings

### § 170.315(b)(8) - Security Tags - Summary of Care - Receive
- **File**: `170.315-b-8-security-tags-receive.feature`
- **Scenarios**: 10
- **Depends On**: b-1, b-7
- **Key Capabilities**: Receive, process, display security tags; user acknowledgment

---

## Tier 5: Specialized Exchange
**Phase 6 Implementation** | **Depends on Tiers 0-4**

Specialized health information exchange capabilities.

### § 170.315(b)(3) - Electronic Prescribing
- **File**: `170.315-b-3-electronic-prescribing.feature`
- **Scenarios**: 22
- **Standards**:
  - § 170.205(b)(1) - NCPDP SCRIPT Standard
  - § 170.207(d)(1), (3) - SCRIPT versions
- **Depends On**: a-1 (medication orders), a-4 (drug interactions), d-1, d-2
- **Key Capabilities**:
  - Required transactions: NewRx, RxChange, CancelRx, RxRenewal, RxFill, RxHistory, Status, Error, Verify
  - Include reason using diagnosis elements
  - Metric units only for oral liquids
  - Leading zeroes, no trailing zeroes

### § 170.315(b)(10) - Electronic Health Information Export
- **File**: `170.315-b-10-ehi-export.feature`
- **Scenarios**: 15
- **Depends On**: ALL clinical data from Tiers 0-4
- **Required By**: e-1 (patient download), MANDATORY per Assurances
- **Key Capabilities**: Export all EHI in computable format, patient/date selection, multiple formats

---

## Tier 6: Public Health Reporting
**Phase 9 Implementation** | **Independent Reporting Streams**

Public health reporting can be implemented in parallel after clinical data is available.

### § 170.315(f)(1) - Transmission to Immunization Registries
- **File**: `170.315-f-1-immunization-registries.feature`
- **Scenarios**: 2
- **Standards**: § 170.205(e)(4), § 170.207(e)(1-2) - HL7 v2.5.1, CVX/MVX
- **Depends On**: Immunization data, a-5, d-1, d-2

### § 170.315(f)(2) - Syndromic Surveillance
- **File**: `170.315-f-2-syndromic-surveillance.feature`
- **Scenarios**: 1
- **Standards**: § 170.205(d)(4)
- **Depends On**: Clinical encounter data, a-5, d-1, d-2

### § 170.315(f)(3) - Reportable Laboratory Tests and Values/Results
- **File**: `170.315-f-3-reportable-laboratory.feature`
- **Scenarios**: 1
- **Standards**: § 170.205(g), § 170.207(a)(1), (c)(1)
- **Depends On**: a-2 (lab orders/results), d-1, d-2

### § 170.315(f)(4) - Transmission to Cancer Registries
- **File**: `170.315-f-4-cancer-registries.feature`
- **Scenarios**: 1
- **Standards**: § 170.205(i)(2), § 170.207(a)(1), (c)(1)
- **Depends On**: Clinical data, a-5, d-1, d-2

### § 170.315(f)(5) - Electronic Case Reporting
- **File**: `170.315-f-5-electronic-case-reporting.feature`
- **Scenarios**: 8
- **Standards**: § 170.205(t)(1-4) - FHIR eCR IG / CDA eICR IG
- **Depends On**: Clinical data, a-5, d-1, d-2, § 170.213 USCDI
- **Key Capabilities**: Functional eCR (trigger tables) OR standards-based eCR (FHIR/CDA)

### § 170.315(f)(6) - Antimicrobial Use and Resistance Reporting
- **File**: `170.315-f-6-antimicrobial-reporting.feature`
- **Scenarios**: 1
- **Standards**: § 170.205(r)(1)
- **Depends On**: Medication data (a-1), lab data (a-2), d-1, d-2

### § 170.315(f)(7) - Health Care Surveys
- **File**: `170.315-f-7-healthcare-surveys.feature`
- **Scenarios**: 1
- **Standards**: § 170.205(s)(1)
- **Depends On**: Clinical data, a-5, d-1, d-2

---

## Tier 7: Patient Engagement
**Phase 8 Implementation** | **Depends on Clinical & Exchange**

Patient-facing capabilities require mature clinical data and export functionality.

### § 170.315(e)(1) - View, Download, and Transmit to 3rd Party
- **File**: `170.315-e-1-view-download-transmit.feature`
- **Scenarios**: 22
- **Depends On**:
  - b-10 (export capability)
  - All USCDI data (§ 170.213)
  - C-CDA documents (b-1)
  - d-1 (patient authentication)
  - d-2 (audit patient access)
- **Key Capabilities**: Patient view/download all USCDI data, transmit to 3rd party, activity log

### § 170.315(e)(2) - Secure Messaging
- **File**: `170.315-e-2-secure-messaging.feature`
- **Scenarios**: 5
- **Depends On**: h-1 (Direct), d-1, d-2
- **Key Capabilities**: Patient-provider secure messaging via Direct

### § 170.315(e)(3) - Patient Health Data Capture
- **File**: `170.315-e-3-patient-data-capture.feature`
- **Scenarios**: 3
- **Depends On**: d-1, d-2, clinical data structures from Tier 1
- **Key Capabilities**: Patient-entered data incorporation, attribution

---

## Tier 8: API Access (Modern Interoperability)
**Phase 7 Implementation** | **Requires ALL Clinical Data**

FHIR-based API access is the modern interoperability approach.

### § 170.315(g)(10) - Standardized API for Patient and Population Services ⭐ **API FOUNDATION**
- **File**: `170.315-g-10-standardized-api.feature`
- **Scenarios**: 12
- **Major Standards**:
  - **§ 170.215(a)** - HL7 FHIR R4
  - **§ 170.215(b)(1)** - US Core Implementation Guide, SMART App Launch
  - **§ 170.215(c)** - OAuth 2.0, OIDC, SMART Backend Services
  - **§ 170.215(d)** - SMART Backend Services (Bulk FHIR)
  - **§ 170.213** - ALL USCDI data classes
- **Depends On**:
  - ALL clinical data from Tiers 1-2 (must support all USCDI)
  - d-1 (authorization server, OAuth)
  - Authentication/authorization infrastructure
- **Required By**: g-7, g-8, g-9, e-1 (API access)
- **Key Capabilities**:
  - Single patient data response (US Core)
  - Multiple patients data response (Bulk FHIR)
  - Search operations (single & multiple patients)
  - App registration
  - Secure connection (patient/user/system scopes)
  - Refresh tokens (≥3 months)
  - Patient authorization revocation (≤1 hour)
  - Token introspection
  - Complete API documentation

### § 170.315(g)(7) - Application Access - Patient Selection
### § 170.315(g)(8) - Application Access - Data Category Request
- **File**: `170.315-g-8-application-access-data-category.feature`
- **Scenarios**: 4
- **Depends On**: g-10 (API infrastructure)
- **Key Capabilities**: Request individual data categories, date filtering, documentation

### § 170.315(g)(9) - Application Access - All Data Request
- **File**: `170.315-g-9-application-access-all-data.feature`
- **Scenarios**: 4
- **Depends On**: g-10 (API infrastructure)
- **Key Capabilities**: Request all data as CCD, date filtering, documentation

---

## Tier 9: Clinical Quality Measures
**Phase 10 Implementation** | **Depends on Clinical Data**

Quality measurement requires comprehensive clinical data collection.

### § 170.315(c)(1) - CQM - Record and Export
- **File**: `170.315-c-1-cqm-record-export.feature`
- **Scenarios**: 7
- **Standards**: § 170.205(h)(2) - QRDA I, CMS eCQM specifications
- **Depends On**: ALL clinical data required for specific CQMs, d-1, d-2
- **Required By**: c-2, c-3, c-4
- **Key Capabilities**: Record CQM data, export QRDA I

### § 170.315(c)(2) - CQM - Import and Calculate
- **File**: `170.315-c-2-cqm-import-calculate.feature`
- **Scenarios**: 5
- **Depends On**: c-1
- **Key Capabilities**: Import QRDA I, calculate CQM results

### § 170.315(c)(3) - CQM - Report
- **File**: `170.315-c-3-cqm-report.feature`
- **Scenarios**: 4
- **Depends On**: c-1, c-2
- **Standards**: § 170.205(k)(1-2) - QRDA III
- **Key Capabilities**: Create QRDA III aggregate reports

### § 170.315(c)(4) - CQM - Filter
- **File**: `170.315-c-4-cqm-filter.feature`
- **Scenarios**: 13
- **Depends On**: c-1, c-2, c-3
- **Key Capabilities**: Filter CQM results by provider, location, date

---

## Tier 10: Additional Security & Privacy
**Phase 11 Implementation** | **Cross-Cutting Security**

Additional security and privacy features that apply across all tiers.

### § 170.315(d)(3) - Audit Report
- **File**: `170.315-d-3-audit-reports.feature`
- **Scenarios**: 2
- **Depends On**: d-2 (audit logging)
- **Key Capabilities**: Generate audit reports per § 170.210(e)(4)

### § 170.315(d)(4) - Amendments
- **File**: `170.315-d-4-amendments.feature`
- **Scenarios**: 5
- **Depends On**: d-1, d-2
- **Key Capabilities**: Select record, process accepted/denied amendments via append OR link

### § 170.315(d)(5) - Automatic Access Time-out
- **File**: `170.315-d-5-automatic-access-timeout.feature`
- **Scenarios**: 2
- **Depends On**: d-1
- **Key Capabilities**: Auto-logout after inactivity, require re-authentication

### § 170.315(d)(6) - Emergency Access
- **File**: `170.315-d-6-emergency-access.feature`
- **Scenarios**: 2
- **Depends On**: d-1
- **Key Capabilities**: Permit identified users emergency EHI access

### § 170.315(d)(7) - End-User Device Encryption
- **File**: `170.315-d-7-end-user-device-encryption.feature`
- **Scenarios**: 4
- **Standards**: § 170.210(a)(2) - AES 256
- **Depends On**: d-1, d-2
- **Key Capabilities**: Encrypt locally stored EHI OR prevent local storage

### § 170.315(d)(8) - Integrity
- **File**: `170.315-d-8-integrity.feature`
- **Scenarios**: 2
- **Standards**: § 170.210(c)(2) - SHA-1 or SHA-2
- **Depends On**: d-1, d-2
- **Key Capabilities**: Create message digest, verify integrity upon receipt

### § 170.315(d)(10) - Auditing Actions on Health Information
- **File**: `170.315-d-10-auditing-actions.feature`
- **Scenarios**: 3
- **Depends On**: d-1, d-2
- **Key Capabilities**: Audit actions, export audit log, encrypted when transmitted

### § 170.315(d)(11) - Accounting of Disclosures
- **File**: `170.315-d-11-accounting-disclosures.feature`
- **Scenarios**: 1
- **Depends On**: d-1, d-2
- **Key Capabilities**: Record disclosures, enable user to create accounting report

### § 170.315(d)(12) - Encrypt Authentication Credentials
- **File**: `170.315-d-12-encrypt-credentials.feature`
- **Scenarios**: 2
- **Standards**: § 170.210(a)(1) - AES 128+
- **Depends On**: d-1
- **Key Capabilities**: Encrypt credentials at rest, hash/salt passwords per § 170.210(g)(1)

### § 170.315(d)(13) - Multi-Factor Authentication
- **File**: `170.315-d-13-multi-factor-auth.feature`
- **Scenarios**: 3
- **Standards**: NIST SP 800-63 Revision 3
- **Depends On**: d-1
- **Key Capabilities**: MFA for patient-facing apps

---

## Tier 11: Design & Performance
**Phase 12 Implementation** | **Quality & Testing Criteria**

Cross-cutting quality, safety, and performance requirements.

### § 170.315(g)(3) - Safety-Enhanced Design
- **File**: `170.315-g-3-safety-enhanced-design.feature`
- **Scenarios**: 9
- **Depends On**: All implemented features
- **Key Capabilities**: User-centered design, usability testing, safety risk analysis

### § 170.315(g)(4) - Quality Management System
- **File**: `170.315-g-4-quality-management-system.feature`
- **Scenarios**: 4
- **Depends On**: All implemented features
- **Key Capabilities**: QMS per ISO 13485 or FDA 21 CFR 820

### § 170.315(g)(5) - Accessibility-Centered Design
- **File**: `170.315-g-5-accessibility.feature`
- **Scenarios**: 4
- **Standards**: WCAG 2.0 Level AA or Section 508
- **Depends On**: All user-facing features
- **Key Capabilities**: Accessibility conformance, testing, documentation

### § 170.315(g)(6) - Consolidated CDA Creation Performance
- **File**: `170.315-g-6-ccda-performance.feature`
- **Scenarios**: 2
- **Depends On**: b-1 (C-CDA creation)
- **Key Capabilities**: Create CCD in ≤15 seconds for 500-20,000 CCDS per § 170.205(a)(4)

---

## Implementation Phases

### Phase 1: Security Foundation (Week 1-2)
**Implement**: d-1, d-2, a-5
**Deliverables**: Authentication, audit logging, patient demographics database
**Tests**: 51 scenarios

### Phase 2: Clinical Core (Week 3-6)
**Implement**: a-1, a-2, a-3, a-14, a-12, a-15
**Deliverables**: CPOE for meds/labs/imaging, UDI tracking, family history, SDOH
**Tests**: 52 scenarios

### Phase 3: Clinical Safety (Week 7-8)
**Implement**: a-4, b-9
**Deliverables**: Drug interaction checks, care plan management
**Tests**: 21 scenarios

### Phase 4: Transport Infrastructure (Week 9-10)
**Implement**: h-1, h-2, d-9
**Deliverables**: Direct messaging, XDR/XDM, trusted connections
**Tests**: 17 scenarios

### Phase 5: Interoperability - C-CDA (Week 11-16) ⭐ **MOST COMPLEX**
**Implement**: b-1, b-2, b-7, b-8
**Deliverables**: C-CDA creation/validation/exchange, reconciliation, security tags
**Tests**: 88 scenarios
**Note**: This is the longest phase - b-1 alone has 48 scenarios

### Phase 6: Specialized Exchange (Week 17-20)
**Implement**: b-3, b-10
**Deliverables**: E-prescribing, EHI export
**Tests**: 37 scenarios

### Phase 7: API Infrastructure (Week 21-25) ⭐ **MODERN INTEROP**
**Implement**: g-10, g-7, g-8, g-9
**Deliverables**: FHIR R4 API with US Core, SMART App Launch, Bulk FHIR
**Tests**: 28 scenarios

### Phase 8: Patient Engagement (Week 26-28)
**Implement**: e-1, e-2, e-3
**Deliverables**: Patient portal with view/download/transmit, secure messaging
**Tests**: 30 scenarios

### Phase 9: Public Health Reporting (Week 29-32)
**Implement**: f-1, f-2, f-3, f-4, f-5, f-6, f-7
**Deliverables**: Immunization, syndromic surveillance, reportable lab, cancer, eCR, antimicrobial, surveys
**Tests**: 15 scenarios

### Phase 10: Quality Measurement (Week 33-35)
**Implement**: c-1, c-2, c-3, c-4
**Deliverables**: CQM record/export, import/calculate, report, filter
**Tests**: 29 scenarios

### Phase 11: Additional Security (Week 36-38)
**Implement**: d-3, d-4, d-5, d-6, d-7, d-8, d-10, d-11, d-12, d-13
**Deliverables**: Comprehensive security and privacy controls
**Tests**: 24 scenarios

### Phase 12: Design & Performance (Week 39-40)
**Implement**: g-3, g-4, g-5, g-6
**Deliverables**: Safety/quality documentation, accessibility, C-CDA performance
**Tests**: 19 scenarios

---

## Critical Standards Reference

### C-CDA (Most Dependencies)
- **§ 170.205(a)(3)** - C-CDA R2.1 CCD
- **§ 170.205(a)(4)** - C-CDA R2.1 base (expires Dec 31, 2025)
- **§ 170.205(a)(5)** - C-CDA R2.1 through Dec 31, 2025
- **§ 170.205(a)(6)** - C-CDA R2.1 after Dec 31, 2025
- **Used by**: b-1, b-2, b-7, b-8, b-9, g-6, g-9

### USCDI (Universal Data Dependency)
- **§ 170.213** - United States Core Data for Interoperability
- **Required by**: b-1, b-2, g-10, e-1, f-5
- **Includes**: All data from a-5, a-12, a-14, a-15, + all clinical data

### FHIR (API Layer)
- **§ 170.215(a)** - HL7 FHIR Release 4.0.1
- **§ 170.215(b)(1)** - US Core 3.1.1+, SMART App Launch 1.0.0+
- **§ 170.215(c)** - OAuth 2.0, OIDC Core
- **§ 170.215(d)** - SMART Backend Services (Bulk FHIR)
- **§ 170.215(e)** - OpenID Connect Core
- **Used by**: g-10, g-7, g-8, g-9, e-1

### Transport
- **§ 170.202(a)(2)** - Direct SMTP (Applicability Statement for Secure Health Transport)
- **§ 170.202(b)** - XDR/XDM with IHE XDS profiles
- **§ 170.202(d)** - Edge Protocol (SMTP & SOAP)
- **§ 170.202(e)(1)** - Delivery Notification
- **§ 170.205(p)(1)** - XDM package
- **Used by**: h-1, h-2, b-1, e-2

### Security & Encryption
- **§ 170.210(a)(1)** - AES 128+ (credentials at rest)
- **§ 170.210(a)(2)** - AES 256 (device encryption)
- **§ 170.210(c)(1)** - TLS 1.2+ (trusted connection)
- **§ 170.210(c)(2)** - SHA-1/SHA-2 (integrity)
- **§ 170.210(e)(1-4)** - Audit log standards
- **§ 170.210(g)(1)** - Hash and salt passwords
- **Used by**: d-1, d-7, d-8, d-9, d-10, d-12

---

## Parallel Implementation Opportunities

These criteria can be implemented in parallel if you have multiple teams:

### Team 1: Foundation + Core Clinical
- Phases 1-3: d-1, d-2, a-5 → a-1, a-2, a-3, a-14, a-12, a-15 → a-4, b-9

### Team 2: Transport + C-CDA
- Phases 4-5: h-1, h-2, d-9 → b-1, b-2, b-7, b-8

### Team 3: APIs (After Team 1 completes Tier 1)
- Phase 7: g-10, g-7, g-8, g-9

### Team 4: Public Health (After Team 1 completes Tier 1)
- Phase 9: f-1, f-2, f-3, f-4, f-5, f-6, f-7

### Team 5: Patient Engagement (After Teams 1, 2, 3)
- Phase 8: e-1, e-2, e-3

### Team 6: Quality (After Team 1)
- Phase 10: c-1, c-2, c-3, c-4

### Team 7: Specialized Exchange (After Teams 1, 2)
- Phase 6: b-3, b-10

---

## Notes

1. **§ 170.315(a)(9) expires January 1, 2025** - Implement § 170.315(b)(11) instead for new certifications
2. **§ 170.205(a)(5) transitions to § 170.205(a)(6)** after December 31, 2025 for C-CDA
3. **§ 170.315(b)(10) EHI Export** is MANDATORY per Cures Act Assurances - cannot skip
4. **§ 170.315(b)(1) Transitions of Care** is the single most complex criterion - budget adequate time
5. **USCDI version**: Current implementation requires USCDI v1 minimum; v5 adds sex parameter, name to use, pronouns (required by Jan 1, 2026)

---

## Estimated Total Implementation Time

- **Sequential Implementation**: 40 weeks (9-10 months)
- **With 3-4 Parallel Teams**: 20-24 weeks (5-6 months)
- **With 7 Parallel Teams**: 16-20 weeks (4-5 months)

**Most Time-Consuming Criteria**:
1. § 170.315(b)(1) - Transitions of Care (48 scenarios, complex C-CDA)
2. § 170.315(g)(10) - Standardized API (12 scenarios, but FHIR/SMART implementation is complex)
3. § 170.315(a)(5) - Demographics (31 scenarios, foundational)
4. § 170.315(b)(11) - Decision Support Interventions (26 scenarios)
5. § 170.315(b)(3) - Electronic Prescribing (22 scenarios, NCPDP SCRIPT)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-21
**Based on**: ONC Health IT Certification Program, 45 CFR Part 170, Subpart C
