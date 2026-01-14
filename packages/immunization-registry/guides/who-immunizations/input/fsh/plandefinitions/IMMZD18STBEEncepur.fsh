
Instance: IMMZD18STBEEncepur
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.TBE.Encepur schedule"
Description: """
IMMZ.D18.S.TBE.Encepur schedule
Encepur, 3-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STBEEncepur, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Tick-borne encephalitis (TBE) Encepur dose 1]], [["""
Provision of the TBE Encepur dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The vaccine can be given from > 1 year of age.
"""]], [[Tick-borne encephalitis (TBE) Encepur dose 1]], [[Tick-borne encephalitis (TBE) Encepur dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[TBE Encepur dose 2]], [["""
Provision of the TBE Encepur dose 2
Trigger event: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: An interval of 1–3 months is recommended between the first 2 doses.
"""]], [[TBE Encepur dose 2]], [[TBE Encepur dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[TBE Encepur dose 3]], [["""
Provision of the TBE Encepur dose 3
Trigger event: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: For Encepur, the requirement is 9–12 months between doses 2 and 3.
"""]], [[TBE Encepur dose 3]], [[TBE Encepur dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[TBE Encepur booster dose]], [["""
Provision of the TBE Encepur booster dose
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
Trigger date: "Date when primary vaccination series was completed"
Create condition: The manufacturer recommends a booster dose to be administered 3 years after completion of the primary series.
"""]], [[TBE Encepur booster dose]], [[TBE Encepur booster dose Create]])
