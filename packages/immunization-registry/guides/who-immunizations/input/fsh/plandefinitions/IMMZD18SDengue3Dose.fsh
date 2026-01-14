
Instance: IMMZD18SDengue3Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Dengue schedule"
Description: """
IMMZ.D18.S.Dengue schedule
CYD-TDV (Dengvaxia), 3-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SDengue3Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Dengue dose 1]], [["""
Provision of dengue dose 1
Trigger event: No dengue doses from primary series were administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 0
Trigger date: To be determined by Member States based on vaccination strategy
Create condition: Dengue dose 1 should be provided based on vaccination strategy
"""]], [[Dengue dose 1]], [[Dengue dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Dengue dose 2]], [["""
Provision of the dengue dose 2
Trigger event: First dengue dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines")
Create condition: Dengue dose 2 should be provided if the previous dose was provide more than 6 months ago
"""]], [[Dengue dose 2]], [[Dengue dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Dengue dose 3]], [["""
Provision of dengue dose 3
Trigger event: Second dengue dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines")
Create condition: Dengue dose 3 should be provided if the previous dose was provide more than 6 months ago
"""]], [[Dengue dose 3]], [[Dengue dose 3 Create]])
