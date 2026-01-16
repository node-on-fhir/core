
Instance: IMMZD18SHPVAlt
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Single-dose schedule"
Description: """
IMMZ.D18.S.Single-dose schedule
Alternative single-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHPVAlt, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Human papillomavirus (HPV) dose 1]], [["""
Provision of the HPV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: HPV dose 1 should be provided if the client is older than 9 years of age.
"""]], [[Human papillomavirus (HPV) dose 1]], [[Human papillomavirus (HPV) dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[HPV dose 2 (Immunocompromised or HIV-positive)]], [["""
Provision of the HPV dose 2 for individuals immunocompromised or infected with HIV
Trigger event: First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 1 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
Create condition: Individuals known to be immunocompromised or infected with HIV should receive at least two HPV vaccine doses.
"""]], [[HPV dose 2 (Immunocompromised or HIV-positive)]], [[HPV dose 2 (Immunocompromised or HIV-positive) Create]])

* insert PlanDefCommunicationRequestAction([[HPV dose 3 (Immunocompromised or HIV-positive)]], [["""
Provision of the HPV dose 3 for individuals immunocompromised or infected with HIV
Trigger event: Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised
Count of vaccines administered (where "Vaccine type" = "HPV vaccines") = 2 AND ("HIV status" = "HIV-positive" OR "Immunocompromised" = TRUE)
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "HPV vaccines")
Create condition: Where possible, three HPV doses should be provided to individuals known to be immunocompromised or infected with HIV.
"""]], [[HPV dose 3 (Immunocompromised or HIV-positive)]], [[HPV dose 3 (Immunocompromised or HIV-positive) Create]])
