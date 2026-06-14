library CMS1317AdvancedCarePlanning version '1.0.000'

using QDM version '5.6'

include CQMCommonQDM version '9.0.000' called Global

codesystem "CPT": 'urn:oid:2.16.840.1.113883.6.12'
codesystem "ICD10CM": 'urn:oid:2.16.840.1.113883.6.90'
codesystem "LOINC": 'urn:oid:2.16.840.1.113883.6.1'
codesystem "SNOMEDCT": 'urn:oid:2.16.840.1.113883.6.96'


valueset "Advance Care Planning Documentation": 'urn:oid:2.16.840.1.113762.1.4.1170.45'
valueset "Advance Directive Documentation": 'urn:oid:2.16.840.1.113762.1.4.1170.43'
valueset "Encounter Inpatient": 'urn:oid:2.16.840.1.113883.3.666.5.307'
valueset "Ethnicity": 'urn:oid:2.16.840.1.114222.4.11.837'
valueset "Federal Administrative Sex": 'urn:oid:2.16.840.1.113762.1.4.1021.121'
valueset "Healthcare Agent and Power of Attorney Documentation": 'urn:oid:2.16.840.1.113762.1.4.1170.31'
valueset "Payer Type":'urn:oid:2.16.840.1.114222.4.11.3591'
valueset "Portable Medical Order Documentation": 'urn:oid:2.16.840.1.113762.1.4.1170.48'
valueset "Race": 'urn:oid:2.16.840.1.114222.4.11.836'

code "Do not resuscitate": 'Z66' from "ICD10CM" display 'Do not resuscitate'
code "Goals, preferences, and priorities for medical treatment": '75773-2' from "LOINC" display 'Goals, preferences, and priorities for medical treatment'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Initial Population":
  exists "Adult Inpatient Encounters During Measurement Period"

define "Denominator":
  "Initial Population"

define "Numerator":
  if "Advance Care Plan Document Before End Of Encounter"
    then true
  else "Discussion Of Advance Care Goals Preferences And Priorities With Decision During Encounter" or "Has Do Not Resuscitate Order During Encounter" 

define "Advance Care Plan Document Before End Of Encounter":
  exists((["Intervention, Performed": "Advance Directive Documentation"]                                                                           
    union ["Intervention, Performed": "Healthcare Agent and Power of Attorney Documentation"]
    union ["Intervention, Performed": "Portable Medical Order Documentation"]
    union ["Assessment, Performed": "Advance Directive Documentation"]
    union ["Assessment, Performed": "Portable Medical Order Documentation"]) ACPDocument
      with "Adult Inpatient Encounters During Measurement Period" MeasurePeriodInpatientEncounters
        such that Coalesce(start of Global."NormalizeInterval"(ACPDocument.relevantDatetime, ACPDocument.relevantPeriod), ACPDocument.authorDatetime) before end of Global."HospitalizationWithObservationAndOutpatientSurgeryService"(MeasurePeriodInpatientEncounters))

define "Discussion Of Advance Care Goals Preferences And Priorities With Decision During Encounter":
  exists((["Intervention, Performed": "Advance Care Planning Documentation"]
    union ["Assessment, Performed": "Goals, preferences, and priorities for medical treatment"]) ACPDiscussion
      with "Adult Inpatient Encounters During Measurement Period" InpatientEncounter
        such that Coalesce(start of Global."NormalizeInterval" (ACPDiscussion.relevantDatetime, ACPDiscussion.relevantPeriod), ACPDiscussion.authorDatetime) during day of Global."HospitalizationWithObservationAndOutpatientSurgeryService"(InpatientEncounter))
 
define "Has Do Not Resuscitate Order During Encounter":                                                            
  exists (["Intervention, Order": "Do not resuscitate"] DoNotResuscitate
    with "Adult Inpatient Encounters During Measurement Period" EncounterInpatient
      such that DoNotResuscitate.authorDatetime during day of Global."HospitalizationWithObservationAndOutpatientSurgeryService"(EncounterInpatient))

define "Adult Inpatient Encounters During Measurement Period":
  ["Encounter, Performed": "Encounter Inpatient"] InpatientHospitalEncounter
    where AgeInYearsAt(date from start of "Measurement Period") >= 18
      and InpatientHospitalEncounter.relevantPeriod ends during day of "Measurement Period"


define "SDE Ethnicity":
  ["Patient Characteristic Ethnicity": "Ethnicity"]

define "SDE Payer":  
  ["Patient Characteristic Payer": "Payer Type"]

define "SDE Race":
  ["Patient Characteristic Race": "Race"]

define "SDE Sex":
  ["Patient Characteristic Sex": "Federal Administrative Sex"]
