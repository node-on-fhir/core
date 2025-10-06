
Instance: IMMZD2DTMeningococcalQuad2
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses"
Description: """
IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses
Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalQuad2, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
"""]], [["""Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM) should be administered as one 
single intramuscular dose to individuals aged ≥ 2 years. A,C,W135,Y-D is also licensed for children aged 9–23 
months and given as a 2-dose series 3 months apart, beginning at 9 months of age.
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses.
  """]], Has Guidance, Guidance)
