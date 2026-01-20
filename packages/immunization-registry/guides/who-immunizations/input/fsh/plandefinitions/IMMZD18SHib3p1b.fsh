
Instance: IMMZD18SHib3p1b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hib.3 doses with booster dose schedule"
Description: """
IMMZ.D18.S.Hib.3 doses with booster dose schedule
3 primary doses with a booster dose (3p+1) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHib3p1b, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Haemophilus influenzae type b (Hib) dose 1]], [["""
Provision of the Hib dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Immunization should start from 6 weeks of age, or as early as possible thereafter. Hib-containing vaccine is not required for healthy children aged over 5 years.
"""]], [[Haemophilus influenzae type b (Hib) dose 1]], [[Haemophilus influenzae type b (Hib) dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Hib dose 2]], [["""
Provision of the Hib dose 2
Trigger event: First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type"= "Hib-containing vaccines" and "Dose number" = 1) − "Date of birth" < 1 year AND Today's date − "Date of birth" ≤ 5 years
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
Create condition: Hib dose 2 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old
"""]], [[Hib dose 2]], [[Hib dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Hib dose 3]], [["""
Provision of the Hib dose 3
Trigger event: Second Hib dose from the primary series was administered. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 2 AND Today's date − "Date of birth" ≤ 5 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
Create condition: Hib dose 3 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old
"""]], [[Hib dose 3]], [[Hib dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[Hib booster dose]], [["""
Provision of the Hib booster dose
Trigger event: Third Hib dose from the primary series was administered. Child's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 3 AND Today's date − "Date of birth" ≤ 5 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
Create condition: Hib booster dose should be provided if the client was given the previous dose more than 6 months ago and the first Hib dose was received by the time the child turned 1 year old
"""]], [[Hib booster dose]], [[Hib booster dose Create]])
