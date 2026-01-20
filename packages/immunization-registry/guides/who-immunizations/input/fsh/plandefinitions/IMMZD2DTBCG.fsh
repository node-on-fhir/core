Instance: IMMZD2DTBCG
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.BCG"
Description: """
IMMZ.D2.DT.BCG
IMMZ.D2.DT.BCG
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTBCG, 0.1.0 )

* insert PlanDefMedicationRequestAction( [[Determine if the client is due for BCG.]], [["""
    Determine if the client is due for BCG vaccine according to the national immunization protocol.
  """]], [["""Neonates born to women of unknown HIV status should be vaccinated as the benefits of BCG 
    vaccination outweigh the risks. Neonates of unknown HIV status born to HIV-infected women should be 
    vaccinated if they have no clinical evidence suggestive of HIV infection.
  """]], Client is due for BCG vaccination, IMMZD2DTBCGMR )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.BCG.]], [["""
Show Guidance for the patient regarding IMMZ.D2.DT.BCG.
"""]], Has Guidance, Guidance)
