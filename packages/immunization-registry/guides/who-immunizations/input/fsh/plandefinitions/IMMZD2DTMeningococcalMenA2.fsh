
Instance: IMMZD2DTMeningococcalMenA2
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses"
Description: """
IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses
MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalMenA2, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
"""]], [["""If, in a specific context, there is a compelling reason to vaccinate infants aged under 9 months, a 2-dose schedule 
should be used starting at 3 months of age, with an interval of at least 8 weeks between doses.
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses.
  """]], Has Guidance, Guidance)
