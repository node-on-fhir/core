
Instance: IMMZD2DTPolioSequential
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Polio.Sequential IPV–bOPV"
Description: """
IMMZ.D2.DT.Polio.Sequential IPV–bOPV
Sequential  "Bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV)" schedule (in countries with high vaccination coverage [e.g. 90–95%] and low importation risk [where neighbouring countries and/or countries that share substantial population movement have a similarly high coverage])
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPolioSequential, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    Sequential  "Bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV)" schedule (in countries with high 
    vaccination coverage [e.g. 90–95%] and low importation risk [where neighbouring countries and/or countries that share 
    substantial population movement have a similarly high coverage])
  """]], [["""For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of 
  age with an interval of 4–8 weeks before administration of the second IPV dose. This should be followed by at least 2 doses 
  of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood. Where a sequential IPV–bOPV 
  schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV to ensure sufficient 
  levels of protection in the intestinal mucosa as well as a decrease in the burden of vaccine-associated paralytic polio (VAPP).
  """]], Client is due for IPV vaccination, IMMZD2DTPolioIPVMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    Sequential  "Bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV)" schedule (in countries with high 
    vaccination coverage [e.g. 90–95%] and low importation risk [where neighbouring countries and/or countries that share 
    substantial population movement have a similarly high coverage])
  """]], [["""For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of 
  age with an interval of 4–8 weeks before administration of the second IPV dose. This should be followed by at least 2 doses 
  of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood. Where a sequential IPV–bOPV 
  schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV to ensure sufficient 
  levels of protection in the intestinal mucosa as well as a decrease in the burden of vaccine-associated paralytic polio (VAPP).
  """]], Client is due for bOPV vaccination, IMMZD2DTPolioOPVMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Polio.Sequential IPV–bOPV.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Polio.Sequential IPV–bOPV.
  """]], Has Guidance, Guidance)
