Instance: IMMZD2DTHepatitisB4Doses
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis B.4 doses"
Description: """
IMMZ.D2.DT.Hepatitis B.4 doses
4-dose schedule (birth dose + 3 primary series doses), on-time start
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisB4Doses, 0.1.0 )

* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
    4-dose schedule (birth dose + 3 primary series doses), on-time start
  """]], [["""Monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; 
  the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
  """]], Client is due for a hepatitis B vaccination, IMMZD2DTHepatitisBMR )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.4 doses.]], [["""
Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.4 doses.
"""]], Has Guidance, Guidance)
