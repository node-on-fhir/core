
Instance: IMMZD2DTPneumococcal2p1b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose"
Description: """
IMMZ.D2.DT.Pneumococcal.2 doses with booster dose
2 primary doses with a booster dose (2p+1)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPneumococcal2p1b, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for BCG.]], [["""
    Determine if the client is due for BCG vaccine according to the national immunization protocol.
    2 primary doses with a booster dose (2p+1)
  """]], [["""For administration of pneumococcal vaccine to infants, WHO recommends a 3-dose schedule 
  administered either as 2p+1 or as 3p+0, starting as early as 6 weeks of age.
  """]], Client is due for pneumococcal vaccination, IMMZD2DTPneumococcalMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for BCG.]], [["""
    Determine if the client is due for BCG vaccine according to the national immunization protocol.
    2 primary doses with a booster dose (2p+1)
  """]], [["""HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses 
  before 12 months of age may benefit from a booster dose in the second year of life. There is no defined 
  minimum or maximum interval between the primary series  and the booster dose.
  """]], Client is due for pneumococcal booster dose, IMMZD2DTPneumococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Pneumococcal.2 doses with booster dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Pneumococcal.2 doses with booster dose.
  """]], Has Guidance, Guidance)
