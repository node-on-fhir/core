
Instance: IMMZD2DTRubellaHigh
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Rubella.High incidence"
Description: """
IMMZ.D2.DT.Rubella.High incidence
Countries with high incidence and mortality from rubella
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTRubellaHigh, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Rubella.]], [["""
    Determine if the client is due for Rubella vaccine according to the national immunization protocol.
    Countries with high incidence and mortality from rubella
  """]], [["""The first dose of rubella-containing vaccine can be delivered at 9 months of age, due 
  to a high level of measles virus transmission.
  """]], Client is due for rubella vaccination, IMMZD2DTRubellaMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Rubella.High incidence.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Rubella.High incidence.
  """]], Has Guidance, Guidance)
