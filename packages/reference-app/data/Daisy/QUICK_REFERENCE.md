# Quick Reference: Daisey Koelpin ONC (g)(10) Test Patient

## Patient Identifiers
- **Patient ID:** `958c63b0-4a7f-2ee7-ef6a-e04df5931b4c`
- **Name:** Daisey627 Jackelyn13 Koelpin146
- **Gender:** Female
- **DOB:** 1996-04-07
- **Age:** 28 years

## File Locations

### Primary Test File
```
fhir/Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json
```
- **Type:** FHIR Bundle (transaction)
- **Entries:** 367 resources
- **Backup:** Same filename + `.backup` extension

### Bulk Data Files
```
bulk/AllergyIntolerance.ndjson    (3 for Daisey + others)
bulk/Coverage.ndjson              (2 for Daisey)
bulk/Goal.ndjson                  (4 for Daisey)
bulk/MedicationDispense.ndjson    (2 for Daisey)
bulk/Observation.ndjson           (86 for Daisey + others)
bulk/RelatedPerson.ndjson         (2 for Daisey)
bulk/ServiceRequest.ndjson        (4 for Daisey)
bulk/Specimen.ndjson              (4 for Daisey)
```

## Resource Counts (Daisey's Records Only)

| Resource Type | Count | ONC Test Section |
|--------------|-------|------------------|
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

**Total: 367 resources across 20 resource types**

## Key Observations for Testing

### Pregnancy (12.19, 12.20)
- **Pregnancy Status** (LOINC 82810-3): 2 observations
- **Pregnancy Intent** (LOINC 86645-9): 2 observations (evolution over time)

### Vital Signs
- **Body Temperature** (LOINC 8310-5): 36.9°C - 12.26
- **Heart Rate** (LOINC 8867-4): Present - 12.25
- **Respiratory Rate** (LOINC 9279-1): Present - 12.22
- **Blood Pressure** (LOINC 85354-9): Present - 12.36
- **Pulse Oximetry** (LOINC 2710-2): 98% on RA - 12.28

### Anthropometrics
- **Body Height** (LOINC 8302-2): Present - 12.32
- **Body Weight** (LOINC 29463-7): Present - 12.40
- **BMI** (LOINC 39156-5): Present - 12.33

### Social History
- **Smoking Status** (LOINC 72166-2): Present - 12.29
- **Occupation** (LOINC 87511-2): Registered Nurse - 12.21

### Preferences
- **Treatment Intervention Preference** (LOINC 96842-0): Non-pharmacological preference - 12.23
- **Care Experience Preference** (LOINC 75773-2): Female providers, continuity - 12.24

### Screening Assessments (12.34)
- GAD-7 (anxiety)
- PHQ-2, PHQ-9 (depression)
- AUDIT-C (alcohol)
- DAST-10 (drugs)
- HARK (domestic violence)
- PRAPARE (SDOH)

## Quick Search Queries

### Find Daisey's allergies:
```bash
cat fhir/Daisey*.json | jq '.entry[] | select(.resource.resourceType == "AllergyIntolerance")'
```

### Find pregnancy observations:
```bash
cat fhir/Daisey*.json | jq '.entry[] | select(.resource.resourceType == "Observation" and .resource.code.coding[].code == "82810-3" or .resource.code.coding[].code == "86645-9")'
```

### Count resources by type:
```bash
cat fhir/Daisey*.json | jq -r '.entry[].resource.resourceType' | sort | uniq -c | sort -rn
```

### Find all goals:
```bash
cat fhir/Daisey*.json | jq '.entry[] | select(.resource.resourceType == "Goal")'
```

### Find specimens:
```bash
cat fhir/Daisey*.json | jq '.entry[] | select(.resource.resourceType == "Specimen")'
```

## Clinical Summary

**Chief Complaints/Conditions:**
- Prediabetes (monitoring with home glucose meter)
- Chronic low back pain
- Anemia
- History of eclampsia and miscarriage

**Medications:**
- Norethindrone 0.35mg (contraceptive)
- Ibuprofen 600mg PRN (pain management)

**Allergies:**
1. Penicillin - SEVERE (urticaria, dyspnea)
2. Sulfonamide - MODERATE (rash)
3. Shellfish - MILD (nausea, hives)

**Insurance:**
- Medicaid (2011-2019) - Inactive
- BCBS Commercial PPO (2020-present) - Active

**Goals:**
1. Prevent diabetes progression (HbA1c < 5.7%)
2. Manage chronic pain (pain ≤ 4/10)
3. Resolve anemia (Hgb ≥ 12 g/dL)
4. Reproductive health planning (effective contraception)

**Emergency Contacts:**
1. Michael Koelpin (spouse) - 555-0123
2. Jackelyn Koelpin (mother) - 555-0456

**Occupation:** Registered Nurse (hospital medical-surgical unit)

## Testing Notes

### Strengths
✅ Comprehensive coverage of all required resource types
✅ Rich observation data including all vital signs
✅ Complete pregnancy data (status + intent)
✅ Social determinants (occupation, preferences, screening)
✅ Full medication lifecycle (request → dispense)
✅ Laboratory workflow (order → specimen → result)
✅ Temporal consistency throughout record

### Special Considerations
- History of intimate partner violence (trauma-informed care testing)
- Complex pregnancy history (eclampsia, miscarriage)
- Multiple chronic conditions requiring care coordination
- Active contraception with future pregnancy planning

## Validation Checklist

- [ ] Load bundle into FHIR server
- [ ] Validate against US Core 7 profiles
- [ ] Verify all references resolve
- [ ] Test Patient resource retrieval
- [ ] Test AllergyIntolerance queries
- [ ] Test Observation pregnancy queries
- [ ] Test Goal retrieval
- [ ] Test Coverage queries
- [ ] Test MedicationDispense queries
- [ ] Test ServiceRequest queries
- [ ] Test Specimen queries
- [ ] Test RelatedPerson queries
- [ ] Run ONC (g)(10) test suite
- [ ] Verify all test cases pass

## Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - Complete implementation details
2. **daisey_narrative_original.md** - Original patient narrative
3. **daisey_narrative_expanded.md** - Enhanced narrative with new resources
4. **QUICK_REFERENCE.md** - This file

## Support Scripts

- **update_daisey_bundle.py** - Regenerate bundle from resource files
- **update_bulk_ndjson.py** - Update bulk NDJSON files

## Last Updated
December 4, 2024

---

**Status:** ✅ READY FOR ONC (g)(10) CERTIFICATION TESTING
