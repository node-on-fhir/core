
Instance: IMMZD18SMeningococcalMenA2
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule"
Description: """
IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule
MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalMenA2, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: If, in a specific context, there is a compelling reason to vaccinate infants aged under 9 months, a 2-priming dose infant schedule should be used starting at 3 months of age.
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 2]], [["""
Provision of the meningococcal dose 2
Trigger event: First meningococcal dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
Create condition: Meningococcal dose 2 should be provided if the client's age is 3–9 months, 8 weeks after the first dose, and there is a compelling reason to vaccinate the infant.
"""]], [[Meningococcal dose 2]], [[Meningococcal dose 2 Create]])
