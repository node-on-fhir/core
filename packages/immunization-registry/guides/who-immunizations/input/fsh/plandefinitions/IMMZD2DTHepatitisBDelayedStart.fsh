Instance: IMMZD2DTHepatitisBDelayedStart
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis B.Delayed start"
Description: """
IMMZ.D2.DT.Hepatitis B.Delayed start
3-dose schedule (no birth dose + 3 doses), delayed start
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisBDelayedStart, 0.1.0 )

* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
    3-dose schedule (no birth dose + 3 doses), delayed start
  """]], [["""If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, 
  with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose. If the 
  vaccination schedule is interrupted, it is not necessary to restart the vaccine series.
  """]], Client is due for hepatitis B vaccination, IMMZD2DTHepatitisBMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
    3-dose schedule (no birth dose + 3 doses), delayed start
  """]], [["""If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, 
  with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose. If the 
  vaccination schedule is interrupted, it is not necessary to restart the vaccine series.
  """]], Client is due for a hepatitis B vaccination, IMMZD2DTHepatitisBMR )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.Delayed start.]], [["""
Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.Delayed start.
"""]], Has Guidance, Guidance)
