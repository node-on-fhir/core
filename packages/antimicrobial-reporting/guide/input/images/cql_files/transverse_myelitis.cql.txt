library "Transverse Myelitis" version '0.0.0'
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
codesystem "ICD-10-CM": 'http://hl7.org/fhir/sid/icd-10-cm'
codesystem "CVX": 'http://hl7.org/fhir/sid/cvx'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'
codesystem "NDC": 'http://hl7.org/fhir/sid/ndc'
codesystem "CPT": 'http://www.ama-assn.org/go/cpt'codesystem "SNOMED": 'http://snomed.info/sct'

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

define "TransverseMyelitis": Concept {
Code 'G37.3' from "ICD-10-CM",
Code '47000000' from "SNOMED"
}

define "EncounterType": {'IMP', 'EMER'}

context Patient

define "TransverseMyelitisCondition":
  ConditionLookBack([Condition: "TransverseMyelitis"], 365 days)

define "CovidImmunization": [Immunization: "Covid Vaccine Drug Exposure"]

define "CovidProcedure": [Procedure: "Covid Vaccine Procedure"]

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
  Interval[ Last("LastCovidInstanceDT") + 1 day, Last("LastCovidInstanceDT") + 90 days]

define "CleanPeriod":
  Interval[ Last("LastCovidInstanceDT") - 365 days, Last("LastCovidInstanceDT")]

define "TransverseMyelitisinRiskPeriod": "TransverseMyelitisCondition" cond
  where (cond.onset as FHIR.dateTime).value in "RiskPeriod"
  or PeriodToInterval(cond.onset as FHIR.Period) overlaps "RiskPeriod"

define "TransverseMyelitisinCleanPeriod": "TransverseMyelitisCondition" cond
    where (cond.onset as FHIR.dateTime).value in "CleanPeriod"
    or PeriodToInterval(cond.onset as FHIR.Period) overlaps "CleanPeriod"

define "RelatedEncounter": [Encounter] enc
        with "TransverseMyelitisinRiskPeriod" cond
        such that exists ({
          (enc.id) ref
            where EndsWith(cond.encounter.reference, '/' +ref)
            and enc.class.code in "EncounterType"}
        )

define "InPopulation":
  exists(TransverseMyelitisinRiskPeriod) and exists("RelatedEncounter") and not exists(TransverseMyelitisinCleanPeriod)

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
            where ((C.onset as FHIR.dateTime).value in LookBackInterval
              or PeriodToInterval(C.onset as FHIR.Period) overlaps LookBackInterval)
              and Last(C.verificationStatus.coding.code.value) = 'confirmed'

define function PeriodToInterval(period FHIR.Period):
  if period is null then
    null
  else
    Interval[period."start".value, period."end".value]
