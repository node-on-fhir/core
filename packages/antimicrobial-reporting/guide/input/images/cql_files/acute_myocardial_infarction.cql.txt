library "AMI" version '0.0.0'
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
codesystem "ICD-10-CM": 'http://hl7.org/fhir/sid/icd-10-cm'
codesystem "CVX": 'http://hl7.org/fhir/sid/cvx'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'
codesystem "NDC": 'http://hl7.org/fhir/sid/ndc'
codesystem "CPT": 'http://www.ama-assn.org/go/cpt'
codesystem "SNOMED": 'http://snomed.info/sct'

define "Covid Vaccine Drug Exposure": Concept {
Code '207' from "CVX",
Code '208' from "CVX",
Code '210' from "CVX",
Code '212' from "CVX",
Code '213' from "CVX",
Code '213' from "CVX",
Code '2470234' from "RxNorm",
Code '2468235' from "RxNorm",
Code '59267100003' from "NDC",
Code '59267100002' from "NDC",
Code '80777027310' from "NDC",
Code '80777027399' from "NDC",
Code '59676058005' from "NDC",
Code '00310122210' from "NDC",
Code '59676058015' from "NDC",
Code '59267100001' from "NDC"
}

define "Covid Vaccine Procedure": Concept {
Code '0002A' from "CPT",
Code '0001A' from "CPT",
Code '91300' from "CPT",
Code '0012A' from "CPT",
Code '0011A' from "CPT",
Code '90301' from "CPT",
Code '0022A' from "CPT",
Code '0021A' from "CPT",
Code '91302' from "CPT"
}

define "AMI Diagnosis": Concept {
Code '45766114' from "SNOMED",
Code 'I22.9' from "ICD-10-CM",
Code 'I22.8' from "ICD-10-CM",
Code 'I22.1' from "ICD-10-CM",
Code 'I22.0' from "ICD-10-CM",
Code '703360004' from "SNOMED",
Code 'I22.2' from "ICD-10-CM",
Code '194858006' from "SNOMED",
Code '194857001' from "SNOMED",
Code 'I21.3' from "ICD-10-CM",
Code 'I21.11' from "ICD-10-CM",
Code 'I21.29' from "ICD-10-CM",
Code 'I21.19' from "ICD-10-CM",
Code 'I21.09' from "ICD-10-CM",
Code 'I21.01' from "ICD-10-CM",
Code 'I21.21' from "ICD-10-CM",
Code 'I21.02' from "ICD-10-CM",
Code 'I21.A9' from "ICD-10-CM",
Code 'I21.4' from "ICD-10-CM",
Code 'I21.A1' from "ICD-10-CM",
Code 'I21.09' from "ICD-10-CM",
Code '22298006' from "SNOMED",
Code '285981000119103' from "SNOMED",
Code '15713121000119105' from "SNOMED",
Code '15713081000119108' from "SNOMED",
Code '401303003' from "SNOMED",
Code '401304000' from "SNOMED",
Code 'I21.9' from "ICD-10-CM",
Code '570544005' from "SNOMED"
}

define "EncounterType": {'IMP'}

context Patient

define "CovidImmunization": [Immunization: "Covid Vaccine Drug Exposure".codes]

define "CovidProcedure": [Procedure: "Covid Vaccine Procedure".codes]

define "MostRecentCovidI": MostRecentImmunizationDT("CovidImmunization")

define "MostRecentCovidP": MostRecentProcedureDT("CovidProcedure")

define "LastCovidInstanceDT":
        case
            when not exists("MostRecentCovidI") then "MostRecentCovidP"
            when not exists("MostRecentCovidP") then "MostRecentCovidI"
            when "MostRecentCovidI" after "MostRecentCovidP" then "MostRecentCovidI"
            else "MostRecentCovidP"
        end

define "RiskPeriod":
  Interval[ Last("LastCovidInstanceDT") + 1 day, Last("LastCovidInstanceDT") + 28 days]

define "CleanPeriod":
  Interval[ Last("LastCovidInstanceDT") - 365 days, Last("LastCovidInstanceDT")]

define "AMIinRiskPeriod": [Condition: "AMI Diagnosis".codes] cond
  where (cond.onset as FHIR.dateTime).value in "RiskPeriod"
  or PeriodToInterval(cond.onset as FHIR.Period) overlaps "RiskPeriod"

define "AMIinCleanPeriod": [Condition: "AMI Diagnosis".codes] cond
    where (cond.onset as FHIR.dateTime).value in "CleanPeriod"
    or PeriodToInterval(cond.onset as FHIR.Period) overlaps "CleanPeriod"

define "RelatedEncounter": [Encounter] enc
    with "AMIinRiskPeriod" cond
    such that exists ({
      (enc.id) ref
        where EndsWith(cond.encounter.reference, '/' +ref)
        and enc.class.code in "EncounterType"}
    )

define "InPopulation":
      exists(AMIinRiskPeriod) and exists("RelatedEncounter") and not exists(AMIinCleanPeriod)

define function MostRecentImmunizationDT(ImmunizationList List<FHIR.Immunization>):
  from ImmunizationList I
  let result: Last(ImmunizationList I sort by (occurrence as FHIR.dateTime).value)
    return (result.occurrence as FHIR.dateTime).value

define function MostRecentProcedureDT(ProcedureList List<FHIR.Procedure>):
  from ProcedureList P
  let result:Last(ProcedureList P sort by (performed as FHIR.dateTime).value)
    return (result.performed as FHIR.dateTime).value


define function ConditionLookBack(CondList List<Condition>, LookBack System.Quantity):
  CondList C
    let LookBackInterval: Interval[Now() - LookBack, Now()]
    where (C.onset as FHIR.dateTime).value before LookBackInterval
      or PeriodToInterval(C.onset as FHIR.Period) before LookBackInterval

define function PeriodToInterval(period FHIR.Period):
  if period is null then
    null
  else
    Interval[period."start".value, period."end".value]
