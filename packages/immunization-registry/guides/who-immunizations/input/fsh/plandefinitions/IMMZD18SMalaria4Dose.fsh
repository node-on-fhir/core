
Instance: IMMZD18SMalaria4Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Malaria schedule"
Description: """
IMMZ.D18.S.Malaria schedule
4-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMalaria4Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Malaria dose 1]], [["""
Provision of the malaria dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: WHO recommends that the first dose of vaccine be administered from 5 months of age.
"""]], [[Malaria dose 1]], [[Malaria dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Malaria dose 2]], [["""
Provision of the malaria dose 2
Trigger event: First malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
Create condition: There should be a minimum interval of 4 weeks between doses.
"""]], [[Malaria dose 2]], [[Malaria dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Malaria dose 3]], [["""
Provision of the malaria dose 3
Trigger event: Second malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
Create condition: There should be a minimum interval of 4 weeks between doses.
"""]], [[Malaria dose 3]], [[Malaria dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[Malaria dose 4]], [["""
Provision of the malaria dose 4
Trigger event: Third malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 3
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
Create condition: There should be a minimum interval of 4 weeks between doses. The fourth dose should be provided approximately 12–18 months after the third dose to prolong the duration of protection.
"""]], [[Malaria dose 4]], [[Malaria dose 4 Create]])
