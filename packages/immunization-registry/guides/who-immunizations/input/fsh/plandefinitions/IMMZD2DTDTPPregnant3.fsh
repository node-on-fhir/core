
Instance: IMMZD2DTDTPPregnant3
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses"
Description: """
IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses
Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDTPPregnant3, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
  """]], [["""Pregnant women who have received only 3 doses of tetanus-containing vaccines during childhood 
  without booster doses should receive 2 doses of tetanus-containing vaccines at the earliest opportunity 
  during pregnancy with a minimal interval of 4 weeks between doses and the second dose at least 2 weeks 
  before giving birth. To provide lifelong protection, a sixth dose would be needed at least 1 year after 
  the fifth dose, or during the next pregnancy.  From 7 years of age, only tetanus toxoid with reduced 
  diphtheria toxoid (Td) combinations should be used. Age-appropriate combinations-containing pertussis 
  vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used 
  for vaccination of persons aged 7 years and older.
  """]], Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses.
  """]], Has Guidance, Guidance)
