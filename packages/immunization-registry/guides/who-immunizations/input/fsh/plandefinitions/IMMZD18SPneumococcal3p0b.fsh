
Instance: IMMZD18SPneumococcal3p0b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Pneumococcal.3 doses schedule"
Description: """
IMMZ.D18.S.Pneumococcal.3 doses schedule
3 primary doses (3p+0) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPneumococcal3p0b, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 1]], [["""
Provision of the pneumococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Pneumococcal dose 1 should be provided if the client is older than 6 weeks
"""]], [[Pneumococcal dose 1]], [[Pneumococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 2, first within 24m]], [["""
Provision of the pneumococcal dose 2
Trigger event: First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 24 months
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
Create condition: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 4 weeks ago
"""]], [[Pneumococcal dose 2, first within 24m]], [[Pneumococcal dose 2, first within 24m Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 2, first after 24m]], [["""
Provision of the pneumococcal dose 2
Trigger event: First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection.
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" ≥ 24 months AND "At high risk for pneumococcal infection" = TRUE
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
Create condition: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
"""]], [[Pneumococcal dose 2, first after 24m]], [[Pneumococcal dose 2, first after 24m Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 3]], [["""
Provision of the pneumococcal dose 3
Trigger event: Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth.
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 2 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines" AND "Dose number" = 1) − "Date of birth" < 12 months
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
Create condition: Pneumococcal dose 3 should be provided if the client was given the previous dose more than 4 weeks ago
"""]], [[Pneumococcal dose 3]], [[Pneumococcal dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal booster dose]], [["""
Provision of booster dose for HIV-positive infants and preterm neonates
Trigger event: Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth.
Today's date − "Date of birth" > 12 months AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 3 AND Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 12 months AND ("HIV status" = "HIV-positive" OR "Preterm birth" = TRUE)
Trigger date: "Date of birth"
Create condition: HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life
"""]], [[Pneumococcal booster dose]], [[Pneumococcal booster dose Create]])
