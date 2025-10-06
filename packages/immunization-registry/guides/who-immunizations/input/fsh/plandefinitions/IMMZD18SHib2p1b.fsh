
Instance: IMMZD18SHib2p1b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hib.2 doses with booster dose schedule"
Description: """
IMMZ.D18.S.Hib.2 doses with booster dose schedule
2 primary doses with a booster dose (2p+1) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHib2p1b, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Haemophilus influenzae type b (Hib) dose 1]], [["""
Provision of the Hib dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Hib dose 1 should be provided if the client is older than 6 weeks
"""]], [[Haemophilus influenzae type b (Hib) dose 1]], [[Haemophilus influenzae type b (Hib) dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Hib dose 2]], [["""
Provision of the Hib dose 2
Trigger event: First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type"= "Hib-containing vaccines" and "Dose number" = 1) − "Date of birth" < 1 year AND Today's date − "Date of birth" ≤ 5 years
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
Create condition: Hib dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
"""]], [[Hib dose 2]], [[Hib dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Hib booster dose]], [["""
Provision of the Hib booster dose
Trigger event: Second Hib dose from the primary series was administered. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 2 AND Today's date − "Date of birth" ≤ 5 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
Create condition: Hib booster dose should be provided if the client was given the previous dose more than 6 months ago
"""]], [[Hib booster dose]], [[Hib booster dose Create]])
