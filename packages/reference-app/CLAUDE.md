# packages/reference-app/CLAUDE.md

# ONC (g)(10) Certification Guide

This guide provides best practices for ONC HealthIT Certification (g)(10) testing with the Honeycomb FHIR server.

## Overview

ONC (g)(10) certification requires demonstrating compliance with FHIR-based data exchange for patient access. The test suite validates:
- SMART on FHIR authentication
- US Core 7 resource profiles
- MustSupport element coverage
- Bulk data export

## Test Patient Strategy

### Primary Test Patient: Daisey Koelpin

**Patient ID:** `958c63b0-4a7f-2ee7-ef6a-e04df5931b4c`

Daisey is a fully prepared test patient with 367 resources covering all ONC requirements.

**Location:** `packages/reference-app/data/Daisy/`

**Key Files:**
- `Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json` - Complete FHIR bundle
- `QUICK_REFERENCE.md` - Quick lookup guide
- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation notes

**Resource Counts:**
| Resource Type | Count | Test Section |
|--------------|-------|--------------|
| Patient | 1 | 12.2 |
| AllergyIntolerance | 3 | 12.3 |
| CarePlan | 2 | 12.4 |
| CareTeam | 2 | 12.5 |
| Condition | 16 | 12.6, 12.7 |
| Coverage | 2 | 12.8 |
| Device | 1 | 12.9 |
| DiagnosticReport | 39 | 12.10, 12.11 |
| DocumentReference | 27 | 12.12 |
| Encounter | 27 | 12.13 |
| Goal | 4 | 12.14 |
| Immunization | 8 | 12.15 |
| MedicationDispense | 2 | 12.16 |
| MedicationRequest | 2 | 12.17 |
| Observation | 86 | 12.18-12.40 |
| Procedure | 74 | 12.41 |
| ServiceRequest | 4 | 12.42 |
| Specimen | 4 | 12.48 |
| RelatedPerson | 2 | 12.47 |
| Provenance | 1 | 12.46 |

---

## Patient MustSupport Elements (Test 12.2.09)

The Patient resource must include these MustSupport elements:

### Required Fields
- `name.use: "old"` - Previous/historical name
- `name.suffix` - Name suffix (e.g., "Jr.", "III")
- `name.period.end` - When name was no longer used
- `deceasedDateTime` - Date/time of death (if applicable)
- `address.use: "old"` - Previous address
- `address.period.end` - When address was no longer used

### Example Patient Structure
```json
{
  "name": [
    {
      "use": "official",
      "family": "Smith",
      "given": ["John"]
    },
    {
      "use": "old",
      "family": "Jones",
      "given": ["John"],
      "suffix": ["Jr."],
      "period": {
        "start": "1970-01-01",
        "end": "2000-01-01"
      }
    }
  ],
  "deceasedDateTime": "2025-12-01T00:00:00Z",
  "address": [
    {
      "use": "home",
      "line": ["123 Main St"],
      "city": "Chicago"
    },
    {
      "use": "old",
      "line": ["456 Previous St"],
      "city": "Boston",
      "period": {
        "start": "1990-01-01",
        "end": "2010-01-01"
      }
    }
  ]
}
```

---

## CareTeam RelatedPerson Reference (Test 12.5.06)

CareTeam resources must include a participant.member that references a RelatedPerson.

### Required Structure
1. **RelatedPerson resource** with US Core profile
2. **CareTeam participant** referencing the RelatedPerson

### Example RelatedPerson
```json
{
  "resourceType": "RelatedPerson",
  "id": "related-person-1",
  "meta": {
    "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-relatedperson"]
  },
  "patient": {
    "reference": "Patient/958c63b0-4a7f-2ee7-ef6a-e04df5931b4c"
  },
  "relationship": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
      "code": "FRND",
      "display": "Friend"
    }]
  }],
  "name": [{"family": "Caregiver", "given": ["Jane"]}]
}
```

### Example CareTeam Participant
```json
{
  "participant": [{
    "role": [{
      "coding": [{
        "system": "http://snomed.info/sct",
        "code": "133932002",
        "display": "Caregiver (person)"
      }]
    }],
    "member": {
      "reference": "RelatedPerson/related-person-1"
    }
  }]
}
```

---

## Available Meteor Methods

### `referenceApp.seedMustSupportReferences(patientId)`
Creates RelatedPerson and adds to CareTeam for MustSupport reference tests.

**Parameters:**
- `patientId` (optional) - Target patient ID. Uses first patient if not specified.

**Creates:**
- RelatedPerson with US Core profile
- CareTeam participant referencing RelatedPerson

### `referenceApp.patchPatientMustSupport(patientId)`
Adds missing MustSupport elements to any patient.

**Parameters:**
- `patientId` - Target patient ID

**Adds:**
- `name` with `use: "old"`, `suffix`, and `period.end`
- `deceasedDateTime`
- `address` with `use: "old"` and `period.end`

### `referenceApp.loadDaiseyPatient()`
Loads the complete Daisey test patient bundle into the database.

**Returns:**
- Summary of loaded resources

---

## OAuth Scopes

Ensure OAuth configuration includes RelatedPerson scopes:
- `patient/RelatedPerson.rs` - For patient-context access
- `user/RelatedPerson.rs` - For user-context access
- `patient/RelatedPerson.read` - For v1 scopes

These are configured in `G10CertificationPage.jsx` in both:
- State defaults (registrationForm, testConfig)
- Export constants (standaloneScopes, ehrScopes, v1Scopes)

---

## Troubleshooting

### 403 Forbidden on RelatedPerson
**Cause:** OAuth token doesn't have RelatedPerson scope
**Fix:**
1. Verify scopes include `patient/RelatedPerson.rs`
2. Start FRESH Inferno test session
3. Re-authenticate to get NEW token

### 12.2.09 Patient MustSupport Missing
**Cause:** Test patient missing required fields
**Fix:**
1. Use Daisey patient (`958c63b0-4a7f-2ee7-ef6a-e04df5931b4c`)
2. Or run `referenceApp.patchPatientMustSupport(patientId)`

### 12.5.06 RelatedPerson Reference Missing
**Cause:** CareTeam doesn't reference RelatedPerson
**Fix:**
1. Use Daisey patient (has RelatedPerson references)
2. Or run `referenceApp.seedMustSupportReferences(patientId)`

### Wrong Patient in Inferno
**Cause:** Inferno testing different patient than expected
**Fix:**
1. In Inferno config, set patient ID to Daisey: `958c63b0-4a7f-2ee7-ef6a-e04df5931b4c`
2. Re-register OAuth client with correct patient

---

## Data Scripts

Located in `data/Daisy/`:

| Script | Purpose |
|--------|---------|
| `update_daisey_bundle.py` | Regenerate bundle from resource files |
| `update_bulk_ndjson.py` | Update bulk NDJSON files |
| `inject_daisy_to_fhir.py` | Inject Daisey into FHIR server |

---

## G10CertificationPage Features

The `/g10-certification` page provides:
- OAuth client registration for Inferno
- Inferno config JSON export
- Patient selector for testing
- "Seed MustSupport References" button
- "Patch Patient MustSupport" button
- "Load Daisey Test Patient" button

---

## Best Practices

1. **Always use Daisey** for certification testing - she's fully prepared
2. **Get fresh OAuth tokens** after any scope changes
3. **Start fresh Inferno sessions** when debugging failures
4. **Check server logs** for scope authorization messages
5. **Verify patient ID** matches between Inferno config and test data

---

## Test Section Reference

| Test | Description | Key Resources |
|------|-------------|---------------|
| 12.2 | Patient tests | Patient |
| 12.3 | AllergyIntolerance | AllergyIntolerance |
| 12.4 | CarePlan | CarePlan |
| 12.5 | CareTeam | CareTeam, RelatedPerson |
| 12.6-7 | Condition | Condition |
| 12.8 | Coverage | Coverage |
| 12.9 | Device | Device |
| 12.10-11 | DiagnosticReport | DiagnosticReport |
| 12.12 | DocumentReference | DocumentReference |
| 12.13 | Encounter | Encounter |
| 12.14 | Goal | Goal |
| 12.15 | Immunization | Immunization |
| 12.16 | MedicationDispense | MedicationDispense |
| 12.17 | MedicationRequest | MedicationRequest |
| 12.18-40 | Observation | Observation (various types) |
| 12.41 | Procedure | Procedure |
| 12.42 | ServiceRequest | ServiceRequest |
| 12.46 | Provenance | Provenance |
| 12.47 | RelatedPerson | RelatedPerson |
| 12.48 | Specimen | Specimen |

---

**Last Updated:** December 7, 2025
