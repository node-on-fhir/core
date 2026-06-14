/*
CMS1317 Advance Care Planning — FHIR/QI-Core translation (FAITHFUL variant)

Translated from the official QDM source CMS1317AdvancedCarePlanning-1.0.000
(vendored at ../qdm/CMS1317AdvancedCarePlanning-1.0.000.cql) for the July
2026 CMS Connectathon PACIO track. Define names mirror the QDM source for
diffability. Authored for MADiE (QI-Core model) — paste into the MADiE CQL
editor and export the measure bundle with ELM.

QDM -> FHIR datatype mapping used here (standard):
  Encounter, Performed      -> Encounter (status 'finished')
  Intervention, Performed   -> Procedure (status 'completed')
  Assessment, Performed     -> Observation (status 'final'/'amended')
  Intervention, Order       -> ServiceRequest (intent 'order', authoredOn)

DOCUMENTED DEVIATION: the QDM source computes the hospitalization window via
CQMCommon."HospitalizationWithObservationAndOutpatientSurgeryService"
(extending backward through observation/ED/outpatient-surgery stays ending
<= 1 hour before admission). This translation uses Encounter.period
directly. See guides/cms1317-fhir-mapping.md.
*/

library CMS1317AdvancedCarePlanningFHIR version '0.1.000'

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

define "SDE Ethnicity":
  Patient.ethnicity

define "SDE Race":
  Patient.race

define "SDE Sex":
  Patient.gender
