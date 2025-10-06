
Instance: IMMZD18SMeningococcalQuad2
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule"
Description: """
IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule
Quadrivalent conjugate vaccine (A,C,W135,Y-D), 2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalQuad2, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 2]], [["""
Provision of the meningococcal dose 2
Trigger event: First meningococcal dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
Create condition: A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.
"""]], [[Meningococcal dose 2]], [[Meningococcal dose 2 Create]])
