
Instance: IMMZD2DTHepatitisALHAV1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose"
Description: """
IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose
Live attenuated hepatitis A virus (HAV), 1 dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisALHAV1, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HepatitisA.]], [["""
Determine if the client is due for HepatitisA vaccine according to the national immunization protocol.
Live attenuated hepatitis A virus (HAV), 1 dose schedule
"""]], [["""Live vaccines are licensed for individuals aged ≥18 months and are administered as a single subcutaneous dose.
"""]], Client is due for Hepatitis A vaccination, IMMZD2DTHepatitisAMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose.
  """]], Has Guidance, Guidance)
