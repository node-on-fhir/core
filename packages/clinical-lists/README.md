# Clinical Lists Package - ONC 170.315(a)(6-8) Compliance

This package implements the clinical lists required for ONC Health IT certification:
- **170.315(a)(6)** - Problem List
- **170.315(a)(7)** - Medication Allergy List  
- **170.315(a)(8)** - Medication List

## Compliance Status

All three requirements are:
- **Algo**: ✅ Implemented
- **Implemented**: ✅ True
- **v3**: ✅ True

## Features

### Problem List (170.315(a)(6))
- POMR (Problem-Oriented Medical Record) compliant
- ICD-10/SNOMED coding support
- Clinical status tracking (active, resolved, inactive)
- Severity assessment
- Onset and resolution date tracking
- Verification status

### Medication Allergy List (170.315(a)(7))
- Critical allergy alerts
- RxNorm medication coding
- Criticality assessment (high, low, unable-to-assess)
- Reaction manifestation tracking
- Clinical status management
- Onset and last occurrence tracking

### Medication List (170.315(a)(8))
- Active medication management
- RxNorm drug coding
- Dosage and frequency tracking
- Route of administration
- Duration visualization (Tufte-inspired)
- Prescriber information
- Indication tracking

## Design Philosophy

The interfaces follow Edward Tufte's principles of information density and Borries Schwesinger's form design best practices:
- Maximum data-ink ratio
- Micro/macro readings
- Small multiples where applicable
- Layered information disclosure
- Clear visual hierarchy

## Usage

Add to your settings file:
```json
{
  "public": {
    "modules": {
      "clinicalLists": {
        "enabled": true,
        "showInSidebar": true
      }
    },
    "defaults": {
      "sidebar": {
        "menuItems": {
          "ProblemList": true,
          "MedicationAllergyList": true,
          "MedicationList": true
        }
      }
    }
  }
}
```

## FHIR Resources

This package works with standard FHIR R4 resources:
- `Condition` - Problem list entries
- `AllergyIntolerance` - Medication allergies
- `MedicationStatement` - Current medications

## Security

All operations require authentication and follow HIPAA audit logging requirements.