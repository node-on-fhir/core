
Instance: IMMZD18SRabiesPrEP
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Rabies schedule"
Description: """
IMMZ.D18.S.Rabies schedule
Rabies schedule (2-dose scheme)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SRabiesPrEP, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Rabies dose 1]], [["""
Provision of rabies dose 1
Trigger event: To be determined by Member States
Trigger date: To be determined by Member States
Create condition: Rabies dose 1 should be provided if the client is at a high risk of rabies virus exposure
"""]], [[Rabies dose 1]], [[Rabies dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Rabies dose 2]], [["""
Provision of rabies dose 2
Trigger event: First rabies dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Rabies vaccines")
Create condition: Rabies dose 2 should be provided if previous dose was given more than 1 week ago
"""]], [[Rabies dose 2]], [[Rabies dose 2 Create]])
