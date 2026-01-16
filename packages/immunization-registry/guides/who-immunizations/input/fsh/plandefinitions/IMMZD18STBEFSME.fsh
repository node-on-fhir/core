
Instance: IMMZD18STBEFSME
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.TBE.FSME-Immun schedule"
Description: """
IMMZ.D18.S.TBE.FSME-Immun schedule
FSME-Immun, 3-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STBEFSME, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Tick-borne encephalitis (TBE) FSME-Immun dose 1]], [["""
Provision of the TBE FSME-Immun dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The vaccine can be given from > 1 year of age
"""]], [[Tick-borne encephalitis (TBE) FSME-Immun dose 1]], [[Tick-borne encephalitis (TBE) FSME-Immun dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[TBE FSME-Immun dose 2]], [["""
Provision of the TBE FSME-Immun dose 2
Trigger event: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: An interval of 1–3 months is recommended between the first 2 doses
"""]], [[TBE FSME-Immun dose 2]], [[TBE FSME-Immun dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[TBE FSME-Immun dose 3]], [["""
Provision of the TBE FSME-Immun dose 3
Trigger event: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: An interval of 5–12 months is recommended between the second and third doses
"""]], [[TBE FSME-Immun dose 3]], [[TBE FSME-Immun dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[TBE FSME-Immun booster dose]], [["""
Provision of the TBE FSME-Immun booster dose
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
Trigger date: "Date when primary vaccination series was completed"
Create condition: The manufacturer recommends a booster dose to be administered 3 years after completion of the primary series
"""]], [[TBE FSME-Immun booster dose]], [[TBE FSME-Immun booster dose Create]])
