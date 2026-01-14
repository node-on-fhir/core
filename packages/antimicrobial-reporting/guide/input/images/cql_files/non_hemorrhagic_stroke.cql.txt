library "Non Hemorrhagic Stroke" version '0.0'
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

context Patient

define "EncounterType": {'IMP'}

define "Non Hemorrhagic Stroke": Concept {
Code 'I63.00' from "ICD-10-CM",
Code 'I63.011' from "ICD-10-CM",
Code 'I63.012' from "ICD-10-CM",
Code 'I63.013' from "ICD-10-CM",
Code 'I63.019' from "ICD-10-CM",
Code 'I63.02' from "ICD-10-CM",
Code 'I63.031' from "ICD-10-CM",
Code 'I63.032' from "ICD-10-CM",
Code 'I63.033' from "ICD-10-CM",
Code 'I63.039' from "ICD-10-CM",
Code 'I63.09' from "ICD-10-CM",
Code 'I63.10' from "ICD-10-CM",
Code 'I63.111' from "ICD-10-CM",
Code 'I63.112' from "ICD-10-CM",
Code 'I63.113' from "ICD-10-CM",
Code 'I63.119' from "ICD-10-CM",
Code 'I63.12' from "ICD-10-CM",
Code 'I63.131' from "ICD-10-CM",
Code 'I63.132' from "ICD-10-CM",
Code 'I63.133' from "ICD-10-CM",
Code 'I63.139' from "ICD-10-CM",
Code 'I63.19' from "ICD-10-CM",
Code 'I63.20' from "ICD-10-CM",
Code 'I63.211' from "ICD-10-CM",
Code 'I63.212' from "ICD-10-CM",
Code 'I63.213' from "ICD-10-CM",
Code 'I63.219' from "ICD-10-CM",
Code 'I63.22' from "ICD-10-CM",
Code 'I63.231' from "ICD-10-CM",
Code 'I63.232' from "ICD-10-CM",
Code 'I63.233' from "ICD-10-CM",
Code 'I63.239' from "ICD-10-CM",
Code 'I63.29' from "ICD-10-CM",
Code 'I63.30' from "ICD-10-CM",
Code 'I63.311' from "ICD-10-CM",
Code 'I63.312' from "ICD-10-CM",
Code 'I63.313' from "ICD-10-CM",
Code 'I63.319' from "ICD-10-CM",
Code 'I63.321' from "ICD-10-CM",
Code 'I63.322' from "ICD-10-CM",
Code 'I63.323' from "ICD-10-CM",
Code 'I63.329' from "ICD-10-CM",
Code 'I63.331' from "ICD-10-CM",
Code 'I63.332' from "ICD-10-CM",
Code 'I63.333' from "ICD-10-CM",
Code 'I63.339' from "ICD-10-CM",
Code 'I63.341' from "ICD-10-CM",
Code 'I63.342' from "ICD-10-CM",
Code 'I63.343' from "ICD-10-CM",
Code 'I63.349' from "ICD-10-CM",
Code 'I63.39' from "ICD-10-CM",
Code 'I63.40' from "ICD-10-CM",
Code 'I63.411' from "ICD-10-CM",
Code 'I63.412' from "ICD-10-CM",
Code 'I63.413' from "ICD-10-CM",
Code 'I63.419' from "ICD-10-CM",
Code 'I63.421' from "ICD-10-CM",
Code 'I63.422' from "ICD-10-CM",
Code 'I63.423' from "ICD-10-CM",
Code 'I63.429' from "ICD-10-CM",
Code 'I63.431' from "ICD-10-CM",
Code 'I63.432' from "ICD-10-CM",
Code 'I63.433' from "ICD-10-CM",
Code 'I63.439' from "ICD-10-CM",
Code 'I63.441' from "ICD-10-CM",
Code 'I63.442' from "ICD-10-CM",
Code 'I63.443' from "ICD-10-CM",
Code 'I63.449' from "ICD-10-CM",
Code 'I63.49' from "ICD-10-CM",
Code 'I63.50' from "ICD-10-CM",
Code 'I63.511' from "ICD-10-CM",
Code 'I63.512' from "ICD-10-CM",
Code 'I63.513' from "ICD-10-CM",
Code 'I63.519' from "ICD-10-CM",
Code 'I63.521' from "ICD-10-CM",
Code 'I63.522' from "ICD-10-CM",
Code 'I63.523' from "ICD-10-CM",
Code 'I63.529' from "ICD-10-CM",
Code 'I63.531' from "ICD-10-CM",
Code 'I63.532' from "ICD-10-CM",
Code 'I63.533' from "ICD-10-CM",
Code 'I63.539' from "ICD-10-CM",
Code 'I63.541' from "ICD-10-CM",
Code 'I63.542' from "ICD-10-CM",
Code 'I63.543' from "ICD-10-CM",
Code 'I63.549' from "ICD-10-CM",
Code 'I63.59' from "ICD-10-CM",
Code 'I63.6' from "ICD-10-CM",
Code 'I63.81' from "ICD-10-CM",
Code 'I63.89' from "ICD-10-CM",
Code 'I63.9' from "ICD-10-CM",
Code '195185009' from "SNOMED",
Code '195185009' from "SNOMED",
Code '64775002' from "SNOMED",
Code '195185009' from "SNOMED",
Code '64775002' from "SNOMED",
Code '195185009' from "SNOMED",
Code '64775002' from "SNOMED",
Code '195185009' from "SNOMED",
Code '64775002' from "SNOMED",
Code '195185009' from "SNOMED",
Code '88174006' from "SNOMED",
Code '195185009' from "SNOMED",
Code '86003009' from "SNOMED",
Code '195185009' from "SNOMED",
Code '86003009' from "SNOMED",
Code '86003009' from "SNOMED",
Code '195185009' from "SNOMED",
Code '195185009' from "SNOMED",
Code '86003009' from "SNOMED",
Code '195185009' from "SNOMED",
Code '266253001' from "SNOMED",
Code '195186005' from "SNOMED",
Code '195186005' from "SNOMED",
Code '65084004' from "SNOMED",
Code '195186005' from "SNOMED",
Code '65084004' from "SNOMED",
Code '195186005' from "SNOMED",
Code '65084004' from "SNOMED",
Code '195186005' from "SNOMED",
Code '65084004' from "SNOMED",
Code '195186005' from "SNOMED",
Code '111296006' from "SNOMED",
Code '195186005' from "SNOMED",
Code '80606009' from "SNOMED",
Code '195186005' from "SNOMED",
Code '80606009' from "SNOMED",
Code '195186005' from "SNOMED",
Code '80606009' from "SNOMED",
Code '195186005' from "SNOMED",
Code '80606009' from "SNOMED",
Code '195186005' from "SNOMED",
Code '230692004' from "SNOMED",
Code '125081000119106' from "SNOMED",
Code '266254007' from "SNOMED",
Code '230692004' from "SNOMED",
Code '230692004' from "SNOMED",
Code '266254007' from "SNOMED",
Code '230692004' from "SNOMED",
Code '266254007' from "SNOMED",
Code '266254007' from "SNOMED",
Code '230692004' from "SNOMED",
Code '230692004' from "SNOMED",
Code '195189003' from "SNOMED",
Code '705130002' from "SNOMED",
Code '705130002' from "SNOMED",
Code '705130002' from "SNOMED",
Code '705130002' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195189003' from "SNOMED",
Code '195190007' from "SNOMED",
Code '705128004' from "SNOMED",
Code '705128004' from "SNOMED",
Code '705128004' from "SNOMED",
Code '705128004' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '195190007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '195230003' from "SNOMED",
Code '359557001' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '432504007' from "SNOMED",
Code '118254002' from "SNOMED",
Code '473449006' from "SNOMED",
Code '473449006' from "SNOMED",
Code '118254002' from "SNOMED",
Code '473449006' from "SNOMED",
Code '118254002' from "SNOMED",
Code '118254002' from "SNOMED",
Code '473449006' from "SNOMED",
Code '371158002' from "SNOMED",
Code '371160000' from "SNOMED",
Code '371160000' from "SNOMED",
Code '69798007' from "SNOMED",
Code '69798007' from "SNOMED",
Code '118254002' from "SNOMED",
Code '473449006' from "SNOMED",
Code '266253001' from "SNOMED",
Code '195232006' from "SNOMED",
Code '195232006' from "SNOMED",
Code '195232006' from "SNOMED",
Code '195232006' from "SNOMED",
Code '195233001' from "SNOMED",
Code '195233001' from "SNOMED",
Code '195233001' from "SNOMED",
Code '195233001' from "SNOMED",
Code '195234007' from "SNOMED",
Code '195234007' from "SNOMED",
Code '195234007' from "SNOMED",
Code '195234007' from "SNOMED",
Code '195235008' from "SNOMED",
Code '20059004' from "SNOMED",
Code '20059004' from "SNOMED",
Code '42970005' from "SNOMED"
}

define "NonHemorrhagicStrokeCondition":
  ConditionLookBack([Condition: "Non Hemorrhagic Stroke"], 365 days)

define "CovidImmunization": [Immunization: "Covid Vaccine Drug Exposure"]

define "CovidProcedure": [Procedure: "Covid Vaccine Drug Exposure"]

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

define "NonHemorrhagicStrokeinRiskPeriod": "NonHemorrhagicStrokeCondition" cond
  where (cond.onset as FHIR.dateTime).value in "RiskPeriod"
  or PeriodToInterval(cond.onset as FHIR.Period) overlaps "RiskPeriod"

define "NonHemorrhagicStrokeinCleanPeriod": "NonHemorrhagicStrokeCondition" cond
    where (cond.onset as FHIR.dateTime).value in "CleanPeriod"
    or PeriodToInterval(cond.onset as FHIR.Period) overlaps "CleanPeriod"

define "RelatedEncounter": [Encounter] enc
    with "NonHemorrhagicStrokeinRiskPeriod" cond
        such that exists ({
          (enc.id) ref
            where EndsWith(cond.encounter.reference, '/' +ref)
            and enc.class.code in "EncounterType"}
        )
define "InPopulation":
  exists("NonHemorrhagicStrokeinRiskPeriod") and exists("RelatedEncounter") and not exists("NonHemorrhagicStrokeinCleanPeriod")

define function MostRecentImmunizationDT(ImmunizationList List<FHIR.Immunization>):
  from ImmunizationList I
  let result: Last(ImmunizationList I sort by (occurrence as FHIR.dateTime).value)
    return (result.occurrence as FHIR.dateTime).value

define function MostRecentProcedureDT(ProcedureList List<FHIR.Procedure>):
  from ProcedureList P
  let result:Last(ProcedureList P sort by (performed as FHIR.dateTime).value)
    return (result.performed  as FHIR.dateTime).value


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
