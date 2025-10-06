
Instance: IMMZD2DTMeningococcalQuad1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose"
Description: """
IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose
Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalQuad1, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
Quadrivalent conjugate vaccines (A,C,W135,Y-CRM), 1-dose schedule
"""]], [["""Quadrivalent conjugate vaccine A,C,W135,Y-CRM should be administered as one single intramuscular dose to individuals aged ≥ 2 years.
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose.
  """]], Has Guidance, Guidance)
