
Instance: IMMZD18SMeningococcalMenA1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule"
Description: """
IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule
MenA conjugate vaccine, 1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalMenA1, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: For MenA conjugate vaccine (5µg), a 1-dose schedule is recommended at 9–18 months of age
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])
