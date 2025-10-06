
Instance: IMMZD2DTDTPPregnant4
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses"
Description: """
IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses
Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDTPPregnant4, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood DTP doses
  """]], [["""Pregnant women who received 4 tetanus-containing vaccines doses during childhood or pre-adulthood 
  need only 1 booster dose, which should be given at the first opportunity. To provide lifelong protection, a sixth 
  dose would be needed at least 1 year after the fifth dose, or during the next pregnancy.  From 7 years of age, 
  only tetanus toxoid with reduced diphtheria toxoid (Td) combinations should be used. Age-appropriate combinations-containing 
  pertussis vaccine with reduced diphtheria toxoid are also available. Only acellular pertussis (aP)-containing vaccines should 
  be used for vaccination of persons aged 7 years and older.
  """]], Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses.
  """]], Has Guidance, Guidance)
