
Instance: IMMZD2DTHPV2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.HPV.2 doses"
Description: """
IMMZ.D2.DT.HPV.2 doses
2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHPV2Dose, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HPV.]], [["""
    Determine if the client is due for HPV vaccine according to the national immunization protocol.
    2-dose schedule
  """]], [["""The current evidence supports the recommendation that a 2-dose schedule be used in 
  the primary target group from 9 years of age and for all older age groups for which HPV vaccines are licensed.
  """]], Client is due for HPV vaccination, IMMZD2DTHPVMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.HPV.2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.HPV.2 doses.
  """]], Has Guidance, Guidance)
