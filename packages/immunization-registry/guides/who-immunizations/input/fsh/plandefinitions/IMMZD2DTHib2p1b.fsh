
Instance: IMMZD2DTHib2p1b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hib.2 doses with booster dose"
Description: """
IMMZ.D2.DT.Hib.2 doses with booster dose
2 primary doses with a booster dose (2p+1)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHib2p1b, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HIb.]], [["""
    Determine if the client is due for HIb vaccine according to the national immunization protocol.
    2 primary doses with a booster dose (2p+1)
  """]], [["""Because serious Hib disease occurs most commonly in children aged between 4 months and 18 months, 
  immunization should start from 6 weeks of age, or as early as possible thereafter. The interval between doses 
  should be at least 8 weeks if 2 primary doses are given. Hib-containing vaccine is not required for healthy 
  children aged over 5 years.
  """]], Client is due for Hib vaccination, IMMZD2DTHibMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HIb.]], [["""
    Determine if the client is due for HIb vaccine according to the national immunization protocol.
    2 primary doses with a booster dose (2p+1)
  """]], [["""Booster doses should be administered at least 6 months after completion of the primary series. 
  """]], Primary series is complete. Client is due for Hib booster dose, IMMZD2DTHibMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hib.2 doses with booster dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Hib.2 doses with booster dose.
  """]], Has Guidance, Guidance)
