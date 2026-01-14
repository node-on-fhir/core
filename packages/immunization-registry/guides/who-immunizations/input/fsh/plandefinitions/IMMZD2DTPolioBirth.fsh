
Instance: IMMZD2DTPolioBirth
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Polio.Birth dose"
Description: """
IMMZ.D2.DT.Polio.Birth dose
Birth dose administration as part of "bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (in countries that are poliomyelitis (polio)-endemic countries or at high risk of importation and subsequent spread of polio that follow the combined bOPV–IPV schedule)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPolioBirth, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    Birth dose administration as part of "bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule 
    (in countries that are poliomyelitis (polio)-endemic countries or at high risk of importation and subsequent spread of 
    polio that follow the combined bOPV–IPV schedule)
  """]], [["""In polio-endemic countries and in countries at high risk of importation and subsequent spread of polio, WHO 
  recommends a bOPV birth dose (zero dose) followed by the primary series of 3 bOPV doses and 2 IPV doses. The zero dose of 
  bOPV should be administered at birth, or within the first week of life, to maximize seroconversion rates following subsequent 
  doses and to induce mucosal protection before enteric pathogens may interfere with the immune response.  Additionally, a birth 
  dose of bOPV administered while infants are still protected by maternally-derived antibodies (up to 6 months) may prevent 
  vaccine-associated paralytic polio (VAPP).
  """]], Client is due for the bOPV birth dose, IMMZD2DTPolioOPVMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Polio.Birth dose.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Polio.Birth dose.
  """]], Has Guidance, Guidance)
