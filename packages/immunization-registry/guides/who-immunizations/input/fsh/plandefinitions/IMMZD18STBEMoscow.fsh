
Instance: IMMZD18STBEMoscow
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.TBE.TBE-Moscow schedule"
Description: """
IMMZ.D18.S.TBE.TBE-Moscow schedule
TBE-Moscow, 3-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STBEMoscow, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Tick-borne encephalitis (TBE)-Moscow dose 1]], [["""
Provision of the TBE-Moscow dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The TBE-Moscow vaccine is not licensed for use in children aged under 3 years.
"""]], [[Tick-borne encephalitis (TBE)-Moscow dose 1]], [[Tick-borne encephalitis (TBE)-Moscow dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[TBE-Moscow dose 2]], [["""
Provision of the TBE-Moscow dose 2
Trigger event: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: The manufacturer of TBE-Moscow recommends a standard primary immunization schedule of 2 doses given at an interval of 1–7 months.
"""]], [[TBE-Moscow dose 2]], [[TBE-Moscow dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[TBE-Moscow dose 3]], [["""
Provision of the TBE-Moscow dose 3
Trigger event: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: The recommended interval is 12 months between the second and third doses.
"""]], [[TBE-Moscow dose 3]], [[TBE-Moscow dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[TBE-Moscow booster dose(s)]], [["""
Provision of the TBE-Moscow booster dose (s)
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
Create condition: TBE booster dose should be provided every 3 years to the client if the country recognizes TBE as a priority and the client has completed the primary series.
"""]], [[TBE-Moscow booster dose(s)]], [[TBE-Moscow booster dose(s) Create]])
