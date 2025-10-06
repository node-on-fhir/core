Instance: IMMZD2DTHepatitisB3Doses
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis B.3 doses"
Description: """
IMMZ.D2.DT.Hepatitis B.3 doses
3-dose schedule (birth dose + 2 primary series doses), on-time start
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisB3Doses, 0.1.0 )

* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
    3-dose schedule (birth dose + 2 primary series doses), on-time start
  """]], [["""The first and second (monovalent or as part of a combined vaccine) may given at the same time as the first and third 
  doses of diphtheria–tetanus–pertussis (DTP)-containing vaccine. The interval between doses should be at least 4 weeks.
  """]], Client is due for a hepatitis B vaccination, IMMZD2DTHepatitisBMR )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.3 doses.]], [["""
Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.3 doses.
"""]], Has Guidance, Guidance)
