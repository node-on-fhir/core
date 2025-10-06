
Instance: IMMZD18SSeasonalinfluenza2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Seasonal influenza schedule"
Description: """
IMMZ.D18.S.Seasonal influenza schedule
Inactivated trivalent and quadrivalent vaccines, 2-dose schedule for children aged under 9 years
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SSeasonalinfluenza2Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Seasonal influenza dose 1]], [["""
Provision of the seasonal influenza vaccine dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Influenza vaccines are safe and effective in children from 6 months of age
"""]], [[Seasonal influenza dose 1]], [[Seasonal influenza dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Seasonal influenza dose 2]], [["""
Provision of the seasonal influenza vaccine dose 2
Trigger event: First seasonal influenza dose from the primary series was administered and client is less than 9 years
Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 1 AND (Today's date − "Date of birth" < 9 years)
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines")
Create condition: Children aged 6 months to 8 years should receive 2 doses at least 4 weeks apart
"""]], [[Seasonal influenza dose 2]], [[Seasonal influenza dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Seasonal influenza annual dose]], [["""
Provision of the seasonal influenza vaccine annual dose
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Seasonal influenza vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines")
Create condition: Seasonal influenza vaccine annual dose should be provided 1 year after the previous dose
"""]], [[Seasonal influenza annual dose]], [[Seasonal influenza annual dose Create]])
