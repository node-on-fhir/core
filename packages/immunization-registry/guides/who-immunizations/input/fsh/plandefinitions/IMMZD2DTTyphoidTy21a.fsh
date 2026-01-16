
Instance: IMMZD2DTTyphoidTy21a
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Typhoid.Ty21a"
Description: """
IMMZ.D2.DT.Typhoid.Ty21a
Live attenuated Ty21a vaccine schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTyphoidTy21a, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Typhoid.]], [["""
    Determine if the client is due for Typhoid vaccine according to the national immunization protocol.
    Live attenuated Ty21a vaccine schedule
  """]], [["""For Ty21a, a 3-dose oral immunization schedule, administering the vaccine every second 
  (alternate) day, is recommended above 6 years of age. If interruption between doses is > 21 days, restart primary series.
  """]], Client is due for Typhoid vaccination, IMMZD2DTTyphoidMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Typhoid.]], [["""
    Determine if the client is due for Typhoid vaccine according to the national immunization protocol.
    Live attenuated Ty21a vaccine schedule
  """]], [["""Revaccination is recommended every 3–7 years for Ty21a (every 1 to 7 years for travellers from non-endemic 
  to endemic areas, depending on national policies). As a general rule, any live vaccine may be given either simultaneously 
  or at an interval of 4 weeks.
  """]], Client is due for typhoid booster dose, IMMZD2DTTyphoidMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Typhoid.Ty21a.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Typhoid.Ty21a.
  """]], Has Guidance, Guidance)
