
Instance: IMMZD18SPneumococcal2p1b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule"
Description: """
IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule
2 primary doses with a booster dose (2p+1) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPneumococcal2p1b, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 1]], [["""
Provision of the pneumococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Pneumococcal dose 1 should be provided if the client is older than 6 weeks
"""]], [[Pneumococcal dose 1]], [[Pneumococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal dose 2]], [["""
Provision of the pneumococcal dose 2
Trigger event: First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND ("Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 24 months OR "At high risk for pneumococcal infection" = TRUE
Trigger date: Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
Create condition: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
"""]], [[Pneumococcal dose 2]], [[Pneumococcal dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal booster dose]], [["""
Provision of the pneumococcal booster dose
Trigger event: Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth
Child's birth AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 2 AND ("Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines" AND "Dose number" = 1) − "Date of birth" < 12 months
Trigger date: "Date of birth"
Create condition: Pneumococcal booster dose should be provided if the client has received the 2 previous doses
"""]], [[Pneumococcal booster dose]], [[Pneumococcal booster dose Create]])

* insert PlanDefCommunicationRequestAction([[Pneumococcal second booster dose]], [["""
Provision of another booster dose for HIV-positive infants and preterm neonates
Trigger event: The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth
'Today's date − "Date of birth" > 12 months AND "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Pneumococcal vaccines") AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Booster dose") = 1 AND Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 12 months AND ("HIV status" = "HIV-positive" OR "Preterm birth" = TRUE)
Trigger date: "Date of birth"
Create condition: HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life
"""]], [[Pneumococcal second booster dose]], [[Pneumococcal second booster dose Create]])
