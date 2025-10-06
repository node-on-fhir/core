library "Deep Vein Thrombosis" version '0.0.0'
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
codesystem "ICD-10-CM": 'http://hl7.org/fhir/sid/icd-10-cm'
codesystem "CVX": 'http://hl7.org/fhir/sid/cvx'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'
codesystem "NDC": 'http://hl7.org/fhir/sid/ndc'
codesystem "CPT": 'http://www.ama-assn.org/go/cpt'
codesystem "SNOMED": 'http://SNOMED.info/sct'

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

context Patient

define "Deep Vein Thrombosis": Concept {
Code 'I82.220' from "ICD-10-CM",
Code 'I82.3' from "ICD-10-CM",
Code 'I82.401' from "ICD-10-CM",
Code 'I82.402' from "ICD-10-CM",
Code 'I82.403' from "ICD-10-CM",
Code 'I82.409' from "ICD-10-CM",
Code 'I82.411' from "ICD-10-CM",
Code 'I82.412' from "ICD-10-CM",
Code 'I82.413' from "ICD-10-CM",
Code 'I82.419' from "ICD-10-CM",
Code 'I82.421' from "ICD-10-CM",
Code 'I82.422' from "ICD-10-CM",
Code 'I82.423' from "ICD-10-CM",
Code 'I82.429' from "ICD-10-CM",
Code 'I82.431' from "ICD-10-CM",
Code 'I82.432' from "ICD-10-CM",
Code 'I82.433' from "ICD-10-CM",
Code 'I82.439' from "ICD-10-CM",
Code 'I82.441' from "ICD-10-CM",
Code 'I82.442' from "ICD-10-CM",
Code 'I82.443' from "ICD-10-CM",
Code 'I82.449' from "ICD-10-CM",
Code 'I82.451' from "ICD-10-CM",
Code 'I82.453' from "ICD-10-CM",
Code 'I82.459' from "ICD-10-CM",
Code 'I82.461' from "ICD-10-CM",
Code 'I82.462' from "ICD-10-CM",
Code 'I82.463' from "ICD-10-CM",
Code 'I82.469' from "ICD-10-CM",
Code 'I82.491' from "ICD-10-CM",
Code 'I82.492' from "ICD-10-CM",
Code 'I82.493' from "ICD-10-CM",
Code 'I82.499' from "ICD-10-CM",
Code 'I82.4Y1' from "ICD-10-CM",
Code 'I82.4Y2' from "ICD-10-CM",
Code 'I82.4Y3' from "ICD-10-CM",
Code 'I82.4Y9' from "ICD-10-CM",
Code 'I82.4Z1' from "ICD-10-CM",
Code 'I82.4Z2' from "ICD-10-CM",
Code 'I82.4Z3' from "ICD-10-CM",
Code 'I82.4Z9' from "ICD-10-CM",
Code 'I82.621' from "ICD-10-CM",
Code 'I82.622' from "ICD-10-CM",
Code 'I82.623' from "ICD-10-CM",
Code 'I82.629' from "ICD-10-CM",
Code 'I83.452' from "ICD-10-CM",
Code '195437003' from "SNOMED",
Code '195438008' from "SNOMED",
Code '444816006' from "SNOMED",
Code '132291000119106' from "SNOMED",
Code '309735004' from "SNOMED",
Code '132251000119101' from "SNOMED",
Code '132261000119104' from "SNOMED",
Code '441739009' from "SNOMED",
Code '448157006' from "SNOMED",
Code '651000119108' from "SNOMED",
Code '132321000119103' from "SNOMED"
}

define "DeepVeinThrombosisCondition":
  ConditionLookBack([Condition: "Deep Vein Thrombosis"], 365 days)

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
  Interval[ Last("LastCovidInstanceDT") + 1 day, Last("LastCovidInstanceDT") + 28 days]

define "CleanPeriod":
  Interval[ Last("LastCovidInstanceDT") - 365 days, Last("LastCovidInstanceDT")]

define "DeepVeinThrombosisinRiskPeriod": "DeepVeinThrombosisCondition" cond
  where (cond.onset as FHIR.dateTime).value in "RiskPeriod"
  or PeriodToInterval(cond.onset as FHIR.Period) overlaps "RiskPeriod"

define "DeepVeinThrombosisinCleanPeriod": "DeepVeinThrombosisCondition" cond
    where (cond.onset as FHIR.dateTime).value in "CleanPeriod"
    or PeriodToInterval(cond.onset as FHIR.Period) overlaps "CleanPeriod"

define "InPopulation":
  exists("DeepVeinThrombosisinRiskPeriod") and not exists("DeepVeinThrombosisinCleanPeriod")

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
