# FHIR R4 Resources Implementation Manifest

This manifest tracks the implementation status of all FHIR R4 resource types in Honeycomb.

**Last Updated:** 2026-01-18

---

## Status Legend

| Status | Description |
|--------|-------------|
| ✅ done | Fully implemented with passing tests |
| 🔶 partial | UI exists but incomplete/no tests |
| ⏳ pending | Not yet implemented |
| ⏭️ skipped | Out of scope or not needed |

## Ownership Models

| Model | Description |
|-------|-------------|
| PA | Patient-Agnostic (no patient context) |
| PO | Patient-Owned (requires patient context) |
| CM | Clinician-Mediated (patient + practitioner) |
| WF | Workflow/Multi-Actor |

---

## Resource Status

| Resource | Status | Ownership | Tests | UI | Notes |
|----------|--------|-----------|-------|-----|-------|
| Account | ⏳ pending | WF | ❌ | ❌ | Financial |
| ActivityDefinition | 🔶 partial | PA | ❌ | ✅ | |
| AdverseEvent | ⏳ pending | PO | ❌ | ❌ | Clinical trials |
| AllergyIntolerance | ✅ done | PO | ✅ | ✅ | |
| Appointment | ✅ done | CM | ✅ | ✅ | |
| AppointmentResponse | ⏳ pending | CM | ❌ | ❌ | |
| AuditEvent | ✅ done | PA | ✅ | ✅ | |
| Basic | ⏳ pending | PA | ❌ | ❌ | |
| Binary | ⏳ pending | PA | ❌ | ❌ | |
| BiologicallyDerivedProduct | ⏳ pending | PA | ❌ | ❌ | |
| BodyStructure | ✅ done | PO | ✅ | ✅ | Radiology workflow |
| Bundle | 🔶 partial | PA | ❌ | ✅ | |
| CapabilityStatement | 🔶 partial | PA | ❌ | ✅ | |
| CarePlan | ✅ done | PO | ✅ | ✅ | |
| CareTeam | ✅ done | PO | ✅ | ✅ | |
| CatalogEntry | ⏳ pending | PA | ❌ | ❌ | |
| ChargeItem | ⏳ pending | WF | ❌ | ❌ | |
| ChargeItemDefinition | ⏳ pending | PA | ❌ | ❌ | |
| Claim | ⏳ pending | WF | ❌ | ❌ | |
| ClaimResponse | ⏳ pending | WF | ❌ | ❌ | |
| ClinicalImpression | ✅ done | CM | ✅ | ✅ | Clinical assessments |
| CodeSystem | 🔶 partial | PA | ❌ | ✅ | |
| Communication | ✅ done | CM | ✅ | ✅ | |
| CommunicationRequest | ⏳ pending | CM | ❌ | ❌ | |
| CompartmentDefinition | ⏳ pending | PA | ❌ | ❌ | |
| Composition | ✅ done | PO | ✅ | ✅ | |
| ConceptMap | ⏳ pending | PA | ❌ | ❌ | |
| Condition | ✅ done | PO | ✅ | ✅ | |
| Consent | ✅ done | PO | ✅ | ✅ | |
| Contract | ⏳ pending | WF | ❌ | ❌ | |
| Coverage | ⏳ pending | WF | ❌ | ❌ | |
| CoverageEligibilityRequest | ⏳ pending | WF | ❌ | ❌ | |
| CoverageEligibilityResponse | ⏳ pending | WF | ❌ | ❌ | |
| DetectedIssue | ⏳ pending | PO | ❌ | ❌ | |
| Device | ✅ done | PA | ✅ | ✅ | |
| DeviceDefinition | ⏳ pending | PA | ❌ | ❌ | |
| DeviceMetric | ⏳ pending | PA | ❌ | ❌ | |
| DeviceRequest | ⏳ pending | CM | ❌ | ❌ | |
| DeviceUseStatement | ⏳ pending | PO | ❌ | ❌ | |
| DiagnosticReport | ✅ done | PO | ✅ | ✅ | |
| DocumentManifest | ⏳ pending | PO | ❌ | ❌ | |
| DocumentReference | ✅ done | PO | ✅ | ✅ | |
| EffectEvidenceSynthesis | ⏳ pending | PA | ❌ | ❌ | |
| Encounter | ✅ done | PO | ✅ | ✅ | |
| Endpoint | 🔶 partial | PA | ❌ | ✅ | |
| EnrollmentRequest | ⏳ pending | WF | ❌ | ❌ | |
| EnrollmentResponse | ⏳ pending | WF | ❌ | ❌ | |
| EpisodeOfCare | ⏳ pending | PO | ❌ | ❌ | |
| EventDefinition | ⏳ pending | PA | ❌ | ❌ | |
| Evidence | 🔶 partial | PA | ❌ | ✅ | |
| EvidenceVariable | ⏳ pending | PA | ❌ | ❌ | |
| ExampleScenario | ⏳ pending | PA | ❌ | ❌ | |
| ExplanationOfBenefit | ⏳ pending | WF | ❌ | ❌ | |
| FamilyMemberHistory | ⏳ pending | PO | ❌ | ❌ | |
| Flag | ⏳ pending | PO | ❌ | ❌ | |
| Goal | ✅ done | PO | ✅ | ✅ | |
| GraphDefinition | ⏳ pending | PA | ❌ | ❌ | |
| Group | 🔶 partial | PA | ❌ | ✅ | |
| GuidanceResponse | ⏳ pending | CM | ❌ | ❌ | |
| HealthcareService | 🔶 partial | PA | ❌ | ✅ | |
| ImagingStudy | ✅ done | PO | ✅ | ✅ | Radiology workflow |
| Immunization | ✅ done | PO | ✅ | ✅ | |
| ImmunizationEvaluation | ⏳ pending | PO | ❌ | ❌ | |
| ImmunizationRecommendation | ⏳ pending | PO | ❌ | ❌ | |
| ImplementationGuide | ⏳ pending | PA | ❌ | ❌ | |
| InsurancePlan | ⏳ pending | PA | ❌ | ❌ | |
| Invoice | ⏳ pending | WF | ❌ | ❌ | |
| Library | 🔶 partial | PA | ❌ | ✅ | |
| Linkage | ⏳ pending | PA | ❌ | ❌ | |
| List | ✅ done | PO | ✅ | ✅ | |
| Location | ✅ done | PA | ✅ | ✅ | |
| Measure | 🔶 partial | PA | ❌ | ✅ | |
| MeasureReport | 🔶 partial | PA | ❌ | ✅ | |
| Media | ✅ done | PO | ✅ | ✅ | |
| Medication | ✅ done | PA | ✅ | ✅ | |
| MedicationAdministration | ✅ done | PO | ✅ | ✅ | |
| MedicationDispense | ⏳ pending | CM | ❌ | ❌ | |
| MedicationKnowledge | ⏳ pending | PA | ❌ | ❌ | |
| MedicationRequest | ✅ done | CM | ✅ | ✅ | |
| MedicationStatement | 🔶 partial | PO | ❌ | ✅ | |
| MedicinalProduct | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductAuthorization | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductContraindication | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductIndication | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductIngredient | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductInteraction | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductManufactured | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductPackaged | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductPharmaceutical | ⏳ pending | PA | ❌ | ❌ | |
| MedicinalProductUndesirableEffect | ⏳ pending | PA | ❌ | ❌ | |
| MessageDefinition | ⏳ pending | PA | ❌ | ❌ | |
| MessageHeader | ✅ done | PA | ✅ | ✅ | |
| MolecularSequence | ⏳ pending | PO | ❌ | ❌ | |
| NamingSystem | ⏳ pending | PA | ❌ | ❌ | |
| NutritionOrder | ✅ done | CM | ✅ | ✅ | |
| Observation | ✅ done | PO | ✅ | ✅ | |
| ObservationDefinition | ⏳ pending | PA | ❌ | ❌ | |
| OperationDefinition | ⏳ pending | PA | ❌ | ❌ | |
| OperationOutcome | 🔶 partial | PA | ❌ | ✅ | |
| Organization | ✅ done | PA | ✅ | ✅ | |
| OrganizationAffiliation | 🔶 partial | PA | ❌ | ✅ | |
| Parameters | ⏳ pending | PA | ❌ | ❌ | |
| Patient | ✅ done | - | ✅ | ✅ | Core resource |
| PaymentNotice | ⏳ pending | WF | ❌ | ❌ | |
| PaymentReconciliation | ⏳ pending | WF | ❌ | ❌ | |
| Person | ⏳ pending | PA | ❌ | ❌ | |
| PlanDefinition | 🔶 partial | PA | ❌ | ✅ | |
| Practitioner | 🔶 partial | PA | ❌ | ✅ | |
| PractitionerRole | 🔶 partial | PA | ❌ | ✅ | |
| Procedure | ✅ done | PO | ✅ | ✅ | |
| Provenance | 🔶 partial | PA | ❌ | ✅ | |
| Questionnaire | ✅ done | PA | ✅ | ✅ | |
| QuestionnaireResponse | ✅ done | PO | ✅ | ✅ | |
| RelatedPerson | ⏳ pending | PA | ❌ | ❌ | |
| RequestGroup | ⏳ pending | CM | ❌ | ❌ | |
| ResearchDefinition | ⏳ pending | PA | ❌ | ❌ | |
| ResearchElementDefinition | ⏳ pending | PA | ❌ | ❌ | |
| ResearchStudy | ✅ done | PA | ✅ | ✅ | Clinical trials |
| ResearchSubject | ✅ done | PO | ✅ | ✅ | Clinical trials |
| RiskAssessment | ⏳ pending | PO | ❌ | ❌ | Radiology workflow |
| RiskEvidenceSynthesis | ⏳ pending | PA | ❌ | ❌ | |
| Schedule | 🔶 partial | PA | ❌ | ✅ | |
| SearchParameter | 🔶 partial | PA | ❌ | ✅ | |
| ServiceRequest | ✅ done | CM | ✅ | ✅ | |
| Slot | ⏳ pending | PA | ❌ | ❌ | |
| Specimen | ⏳ pending | PO | ❌ | ❌ | |
| SpecimenDefinition | ⏳ pending | PA | ❌ | ❌ | |
| StructureDefinition | 🔶 partial | PA | ❌ | ✅ | |
| StructureMap | ⏳ pending | PA | ❌ | ❌ | |
| Subscription | 🔶 partial | PA | ❌ | ✅ | |
| Substance | ⏳ pending | PA | ❌ | ❌ | |
| SubstanceNucleicAcid | ⏳ pending | PA | ❌ | ❌ | |
| SubstancePolymer | ⏳ pending | PA | ❌ | ❌ | |
| SubstanceProtein | ⏳ pending | PA | ❌ | ❌ | |
| SubstanceReferenceInformation | ⏳ pending | PA | ❌ | ❌ | |
| SubstanceSourceMaterial | ⏳ pending | PA | ❌ | ❌ | |
| SubstanceSpecification | ⏳ pending | PA | ❌ | ❌ | |
| SupplyDelivery | 🔶 partial | CM | ❌ | ✅ | |
| SupplyRequest | ⏳ pending | CM | ❌ | ❌ | |
| Task | ✅ done | CM | ✅ | ✅ | |
| TerminologyCapabilities | ⏳ pending | PA | ❌ | ❌ | |
| TestReport | ⏳ pending | PA | ❌ | ❌ | |
| TestScript | ⏳ pending | PA | ❌ | ❌ | |
| ValueSet | 🔶 partial | PA | ❌ | ✅ | |
| VerificationResult | 🔶 partial | PA | ❌ | ✅ | |
| VisionPrescription | ⏳ pending | CM | ❌ | ❌ | |

---

## Priority Workflows

### Radiology Workflow

Resources needed for imaging/radiology use cases (in implementation order):

1. Patient ✅
2. Practitioner 🔶
3. Organization ✅
4. PlanDefinition 🔶
5. Encounter ✅
6. Procedure ✅
7. **BodyStructure ✅** (was BodySite in R3)
8. Questionnaire ✅
9. QuestionnaireResponse ✅
10. ImagingStudy ✅
11. DocumentReference ✅
12. Observation ✅
13. RiskAssessment ⏳
14. DiagnosticReport ✅
15. Measure 🔶
16. MeasureReport 🔶

### Clinical Trials Workflow

Resources needed for research/trials use cases:

1. AdverseEvent ⏳
2. AllergyIntolerance ✅
3. Condition ✅
4. Evidence 🔶
5. MedicationStatement 🔶
6. MedicationAdministration ✅
7. MedicationRequest ✅
8. Medication ✅
9. ResearchSubject ✅
10. ResearchStudy ✅
11. Observation ✅

---

## Statistics

- **Total Resources:** 146
- **Done (with tests):** 32
- **Partial (UI only):** 25
- **Pending:** 87
- **Skipped:** 2

---

## Change Log

| Date | Resource | Action | Notes |
|------|----------|--------|-------|
| 2026-01-18 | ClinicalImpression | ✅ done | Clinical assessments (CM) |
| 2026-01-18 | BodyStructure | ✅ done | First Ralph loop implementation |

