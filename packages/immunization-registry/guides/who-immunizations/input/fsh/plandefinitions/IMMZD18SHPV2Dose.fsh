
Instance: IMMZD18SHPV2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.HPV.2-dose schedule"
Description: """
IMMZ.D18.S.HPV.2-dose schedule
2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHPV2Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[HPV dose 1]], [["""
Provision of the HPV dose 1
Trigger event: Child's birth when client's biological sex is female
Child's birth AND "Sex" = "Female"
Trigger date: "Date of birth"
Create condition: HPV dose 1 should be provided if the client is female and older than 9 years of age.
"""]], [[HPV dose 1]], [[HPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[HPV dose 2]], [["""
Provision of the HPV dose 2
Trigger event: First HPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
Create condition: HPV dose 2 should be provided if dose 1 was given 6 months ago.
"""]], [[HPV dose 2]], [[HPV dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[HPV dose 3 (immunocompromised or HIV-positive)]], [["""
Provision of the HPV dose 3 for individuals immunocompromised or infected with HIV
Trigger event: Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines" and "Type of dose" = "Primary series") = 2 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
Create condition: Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.
"""]], [[HPV dose 3 (immunocompromised or HIV-positive)]], [[HPV dose 3 (immunocompromised or HIV-positive) Create]])
