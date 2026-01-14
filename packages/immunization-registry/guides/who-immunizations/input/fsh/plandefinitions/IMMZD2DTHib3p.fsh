
Instance: IMMZD2DTHib3p
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hib.3 doses"
Description: """
IMMZ.D2.DT.Hib.3 doses
3 primary doses without a booster dose (3p)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHib3p, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for HIb.]], [["""
    Determine if the client is due for HIb vaccine according to the national immunization protocol.
    3 primary doses without a booster dose (3p)
  """]], [["""Because serious Hib disease occurs most commonly in children aged 4–18 months, immunization 
  should start from 6 weeks of age, or as early as possible thereafter. The interval between doses should 
  be at least 4 weeks if 3 primary doses are given. Hib-containing vaccine is not required for healthy 
  children aged over  5 years.
  """]], Client is due for Hib vaccination, IMMZD2DTHibMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hib.3 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Hib.3 doses.
  """]], Has Guidance, Guidance)
