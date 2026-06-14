/*
CMS1317 Advance Care Planning — FHIR/QI-Core translation (PACIO-EXTENDED variant)

Identical to CMS1317AdvancedCarePlanningFHIR except for two clearly-marked
PACIO extensions that reflect how PACIO-conformant systems actually persist
this data:

  EXTENSION 1 (document path): advance directives in PACIO systems ARE
    DocumentReference resources (ADI IG ADI-DocumentReference profile). The
    faithful QDM->FHIR mapping (Procedure/Observation retrieves) misses them
    entirely. This variant adds a DocumentReference retrieve to the document
    path.

  EXTENSION 2 (DNR path): real-world systems frequently record DNR status as
    a coded Condition (Z66 is an ICD-10-CM *status* code), not an order.
    This variant adds a Condition retrieve to the DNR path.

The delta between this variant and the faithful one, computed over the same
patients, is the PACIO track's feedback artifact: it quantifies how much a
faithful FHIR translation of CMS1317 would under-count in PACIO systems.

Authored for MADiE (QI-Core model). See ../qdm/ for the official QDM source
and guides/cms1317-fhir-mapping.md for the full mapping discussion.
*/

library CMS1317AdvancedCarePlanningPACIO version '0.1.000'

using QICore version '4.1.1'

include FHIRHelpers version '4.1.000' called FHIRHelpers
include QICoreCommon version '1.5.000' called QICoreCommon

codesystem "ICD10CM": 'http://hl7.org/fhir/sid/icd-10-cm'
codesystem "LOINC": 'http://loinc.org'

valueset "Advance Care Planning Documentation": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1170.45'
valueset "Advance Directive Documentation": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1170.43'
valueset "Encounter Inpatient": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.666.5.307'
valueset "Healthcare Agent and Power of Attorney Documentation": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1170.31'
valueset "Portable Medical Order Documentation": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1170.48'

code "Do not resuscitate": 'Z66' from "ICD10CM" display 'Do not resuscitate'
code "Goals, preferences, and priorities for medical treatment": '75773-2' from "LOINC" display 'Goals, preferences, and priorities for medical treatment'

parameter "Measurement Period" Interval<DateTime>
  default Interval[@2026-01-01T00:00:00.0, @2027-01-01T00:00:00.0)

context Patient

define "Initial Population":
  exists "Adult Inpatient Encounters During Measurement Period"

define "Denominator":
  "Initial Population"

define "Numerator":
  "Advance Care Plan Document Before End Of Encounter"
    or "Discussion Of Advance Care Goals Preferences And Priorities With Decision During Encounter"
    or "Has Do Not Resuscitate Order During Encounter"

define "Adult Inpatient Encounters During Measurement Period":
  [Encounter: "Encounter Inpatient"] InpatientHospitalEncounter
    where InpatientHospitalEncounter.status = 'finished'
      and AgeInYearsAt(date from start of "Measurement Period") >= 18
      and InpatientHospitalEncounter.period ends during day of "Measurement Period"

define "Advance Care Plan Document Before End Of Encounter":
  exists(("ACP Document Procedures" union "ACP Document Procedures HCA" union "ACP Document Procedures PMO") ACPDocumentProcedure
    with "Adult Inpatient Encounters During Measurement Period" MeasurePeriodInpatientEncounters
      such that Coalesce(start of QICoreCommon."ToInterval"(ACPDocumentProcedure.performed), ACPDocumentProcedure.performed.toValue()) before end of MeasurePeriodInpatientEncounters.period)
  or exists(("ACP Document Assessments" union "ACP Document Assessments PMO") ACPDocumentAssessment
    with "Adult Inpatient Encounters During Measurement Period" MeasurePeriodInpatientEncounters
      such that Coalesce(start of QICoreCommon."ToInterval"(ACPDocumentAssessment.effective), ACPDocumentAssessment.issued) before end of MeasurePeriodInpatientEncounters.period)
  // PACIO EXTENSION 1: ADI documents persisted as DocumentReferences
  or exists("PACIO ADI Document References" ADIDocument
    with "Adult Inpatient Encounters During Measurement Period" MeasurePeriodInpatientEncounters
      such that ADIDocument.date is null
        or ADIDocument.date before end of MeasurePeriodInpatientEncounters.period)

// PACIO EXTENSION 1: non-revoked DocumentReferences whose type is an ADI
// document type (union of the three document value sets; PACIO ADI systems
// stamp meta.profile ADI-DocumentReference, but type-based retrieval is
// portable across servers)
define "PACIO ADI Document References":
  ([DocumentReference: "Advance Directive Documentation"]
    union [DocumentReference: "Healthcare Agent and Power of Attorney Documentation"]
    union [DocumentReference: "Portable Medical Order Documentation"]) ADIDoc
    where ADIDoc.status = 'current'

define "ACP Document Procedures":
  [Procedure: "Advance Directive Documentation"] P where P.status = 'completed'

define "ACP Document Procedures HCA":
  [Procedure: "Healthcare Agent and Power of Attorney Documentation"] P where P.status = 'completed'

define "ACP Document Procedures PMO":
  [Procedure: "Portable Medical Order Documentation"] P where P.status = 'completed'

define "ACP Document Assessments":
  [Observation: "Advance Directive Documentation"] O where O.status in { 'final', 'amended', 'corrected' }

define "ACP Document Assessments PMO":
  [Observation: "Portable Medical Order Documentation"] O where O.status in { 'final', 'amended', 'corrected' }

define "Discussion Of Advance Care Goals Preferences And Priorities With Decision During Encounter":
  exists([Procedure: "Advance Care Planning Documentation"] ACPDiscussionProcedure
    with "Adult Inpatient Encounters During Measurement Period" InpatientEncounter
      such that ACPDiscussionProcedure.status = 'completed'
        and Coalesce(start of QICoreCommon."ToInterval"(ACPDiscussionProcedure.performed), ACPDiscussionProcedure.performed.toValue()) during day of InpatientEncounter.period)
  or exists([Observation: "Goals, preferences, and priorities for medical treatment"] ACPDiscussionAssessment
    with "Adult Inpatient Encounters During Measurement Period" InpatientEncounter
      such that ACPDiscussionAssessment.status in { 'final', 'amended', 'corrected' }
        and Coalesce(start of QICoreCommon."ToInterval"(ACPDiscussionAssessment.effective), ACPDiscussionAssessment.issued) during day of InpatientEncounter.period)

define "Has Do Not Resuscitate Order During Encounter":
  exists([ServiceRequest: "Do not resuscitate"] DoNotResuscitate
    with "Adult Inpatient Encounters During Measurement Period" EncounterInpatient
      such that DoNotResuscitate.intent = 'order'
        and DoNotResuscitate.status in { 'active', 'completed' }
        and DoNotResuscitate.authoredOn during day of EncounterInpatient.period)
  // PACIO EXTENSION 2: Z66 recorded as a Condition during the hospitalization
  or exists([Condition: "Do not resuscitate"] DNRCondition
    with "Adult Inpatient Encounters During Measurement Period" EncounterInpatient
      such that Coalesce(DNRCondition.recordedDate, start of QICoreCommon."ToPrevalenceInterval"(DNRCondition)) during day of EncounterInpatient.period)

define "SDE Ethnicity":
  Patient.ethnicity

define "SDE Race":
  Patient.race

define "SDE Sex":
  Patient.gender
