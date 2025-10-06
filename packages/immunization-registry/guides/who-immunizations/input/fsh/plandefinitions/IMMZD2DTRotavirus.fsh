
Instance: IMMZD2DTRotavirus
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Rotavirus"
Description: """
IMMZ.D2.DT.Rotavirus
IMMZ.D2.DT.Rotavirus
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTRotavirus, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Rotavirus.]], [["""
    Determine if the client is due for Rotavirus vaccine according to the national immunization protocol.
  """]], [["""WHO recommends that the first dose of rotavirus vaccine be administered as soon as possible after 6 weeks of age.
  A minimum interval of 4 weeks should be maintained between doses.  Note: The rotavirus vaccination series for each child should 
  be completed with the same product whenever feasible. However, if the product used for a prior dose is unavailable or unknown, 
  the series should be completed with any available licensed product.
  """]], Client is due for rotavirus vaccination, IMMZD2DTRotavirusMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Rotavirus.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Rotavirus.
  """]], Has Guidance, Guidance)
