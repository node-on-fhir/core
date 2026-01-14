
Instance: IMMZD18SMeningococcalQuad1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule"
Description: """
IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule
Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM), 1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalQuad1, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM) should be administered as one single intramuscular dose to individuals aged ≥2 years.
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])
