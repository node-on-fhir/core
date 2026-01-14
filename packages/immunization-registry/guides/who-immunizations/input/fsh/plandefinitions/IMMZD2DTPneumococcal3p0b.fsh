
Instance: IMMZD2DTPneumococcal3p0b
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Pneumococcal.3 doses"
Description: """
IMMZ.D2.DT.Pneumococcal.3 doses
3 primary doses (3p+0)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPneumococcal3p0b, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for BCG.]], [["""
    Determine if the client is due for BCG vaccine according to the national immunization protocol.
    3 primary doses (3p+0)
  """]], [["""For administration of pneumococcal vaccine to infants, WHO recommends a 3-dose schedule 
  administered either as 2p+1 or as 3p+0, starting as early as 6 weeks of age.
  """]], Client is due for pneumococcal vaccination, IMMZD2DTPneumococcalMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for BCG.]], [["""
    Determine if the client is due for BCG vaccine according to the national immunization protocol.
    3 primary doses (3p+0)
  """]], [["""HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses 
  before 12 months of age may benefit from a booster dose in the second year of life.
  """]], Client is due for pneumococcal booster dose, IMMZD2DTPneumococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Pneumococcal.3 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Pneumococcal.3 doses.
  """]], Has Guidance, Guidance)
