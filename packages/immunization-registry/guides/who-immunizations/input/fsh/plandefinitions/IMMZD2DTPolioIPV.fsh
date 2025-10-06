
Instance: IMMZD2DTPolioIPV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Polio.IPV-only"
Description: """
IMMZ.D2.DT.Polio.IPV-only
Inactivated polio vaccine (IPV)-only (in countries, in polio-free regions, with a very low risk of importation and sustained high routine immunization coverage (third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] > 90%)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPolioIPV, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    Inactivated polio vaccine (IPV)-only (in countries, in polio-free regions, with a very low risk of importation 
    and sustained high routine immunization coverage (third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] > 90%)
  """]], [["""A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4-week interval between doses, is recommended. 
  """]], Client is due for IPV vaccination, IMMZD2DTPolioIPVMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    Inactivated polio vaccine (IPV)-only (in countries, in polio-free regions, with a very low risk of importation 
    and sustained high routine immunization coverage (third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] > 90%)
  """]], [["""If the primary series begins at 6 weeks, a booster dose should be given 6 months or more after the third dose. 
  """]], Primary series is complete. Client is due for IPV booster dose, IMMZD2DTPolioIPVMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Polio.IPV-only.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Polio.IPV-only.
  """]], Has Guidance, Guidance)
