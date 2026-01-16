
Instance: IMMZD2DTRubellaLow
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Rubella.Low incidence"
Description: """
IMMZ.D2.DT.Rubella.Low incidence
Countries with low incidence of rubella
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTRubellaLow, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Rubella.]], [["""
    Determine if the client is due for Rubella vaccine according to the national immunization protocol.
    Countries with low incidence of rubella
  """]], [["""The first dose of rubella-containing vaccine can be delivered at 12 months of age.
  """]], Client is due for rubella vaccination, IMMZD2DTRubellaMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Rubella.Low incidence.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Rubella.Low incidence.
  """]], Has Guidance, Guidance)
