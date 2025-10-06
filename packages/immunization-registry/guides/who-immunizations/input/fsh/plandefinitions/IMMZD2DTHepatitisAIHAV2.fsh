
Instance: IMMZD2DTHepatitisAIHAV2
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses"
Description: """
IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses
Inactivated hepatitis A virus (HAV), 2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisAIHAV2, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HepatitisA.]], [["""
Determine if the client is due for HepatitisA vaccine according to the national immunization protocol.
Inactivated hepatitis A virus (HAV), 2-dose schedule
"""]], [["""For children, inactivated hepatitis A-containing vaccines can be given as a single-dose or 
2-dose schedule, and administered intramuscularly.  
For adults aged over 40 years, vaccination with inactivated vaccines using the 2-dose schedule is preferred 
since there is insufficient evidence on the immunogenicity and long-term protection from a single dose in this age group. 
With a 2-dose schedule, the first dose should be given from ≥ 12 months of age.
The interval between doses is flexible, from 6 months to 4–5 years or more, but is usually 6–18 months.
"""]], Client is due for Hepatitis A vaccination, IMMZD2DTHepatitisAMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses.
  """]], Has Guidance, Guidance)
