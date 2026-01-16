
Instance: IMMZD2DTMeningococcalMenA1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose"
Description: """
IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose
MenA conjugate vaccine, 1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalMenA1, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
MenA conjugate vaccine, 1-dose schedule
"""]], [["""For MenA conjugate vaccine (5µg), a 1-dose schedule is recommended at 9–18 months of age based on 
local programmatic and epidemiologic considerations.  Any children who miss vaccination at the recommended age 
should be vaccinated as soon as possible thereafter. MenAfriVac 5 µg should be used for routine immunization of 
infants and young children aged 3 to 24 months.  MenAfriVac 10 µg should be used for catch-up and periodic campaigns 
from 12 months of age onwards.
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose.
  """]], Has Guidance, Guidance)
