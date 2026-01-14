
Instance: IMMZD2DTPoliobOPVIPV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Polio.bOPV plus IPV"
Description: """
IMMZ.D2.DT.Polio.bOPV plus IPV
 "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTPoliobOPVIPV, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
  """]], [["""For all countries using OPV in their national immunization programme, WHO recommends 3 doses of bOPV and 2 doses of IPV.  
  The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval 
  between doses. The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the 
  diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 
  4 months later (possibly coinciding with other vaccines administered at 9 months of age).  Note: Based on local epidemiology, 
  programmatic implications and feasibility of delivery, countries may choose an alternative “early IPV schedule” starting with 
  the first IPV dose at 6 weeks of age (with DTP1/penta1) and the second IPV dose at 14 weeks (with DTP3/penta3).
  """]], Client is due for bOPV vaccination, IMMZD2DTPolioOPVMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
  """]], [["""For all countries using OPV in their national immunization programme, WHO recommends 3 doses of bOPV and 2 doses of IPV.  
  The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval 
  between doses. The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the 
  diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 
  4 months later (possibly coinciding with other vaccines administered at 9 months of age).  Note: Based on local epidemiology, 
  programmatic implications and feasibility of delivery, countries may choose an alternative “early IPV schedule” starting with 
  the first IPV dose at 6 weeks of age (with DTP1/penta1) and the second IPV dose at 14 weeks (with DTP3/penta3).
  """]], Client is due for bOPV and IPV vaccination, IMMZD2DTPolioOPVMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
  """]], [["""For all countries using OPV in their national immunization programme, WHO recommends 3 doses of bOPV and 2 doses of IPV.  
  The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval 
  between doses. The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the 
  diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 
  4 months later (possibly coinciding with other vaccines administered at 9 months of age).  Note: Based on local epidemiology, 
  programmatic implications and feasibility of delivery, countries may choose an alternative “early IPV schedule” starting with 
  the first IPV dose at 6 weeks of age (with DTP1/penta1) and the second IPV dose at 14 weeks (with DTP3/penta3).
  """]], Client is due for bOPV and IPV vaccination, IMMZD2DTPolioIPVMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a poliovirus vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
    "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
  """]], [["""For all countries using OPV in their national immunization programme, WHO recommends 3 doses of bOPV and 2 doses of IPV.  
  The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval 
  between doses. The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the 
  diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 
  4 months later (possibly coinciding with other vaccines administered at 9 months of age).  Note: Based on local epidemiology, 
  programmatic implications and feasibility of delivery, countries may choose an alternative “early IPV schedule” starting with 
  the first IPV dose at 6 weeks of age (with DTP1/penta1) and the second IPV dose at 14 weeks (with DTP3/penta3).
  """]], Client is due for IPV vaccination, IMMZD2DTPolioIPVMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Polio.bOPV plus IPV.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Polio.bOPV plus IPV.
  """]], Has Guidance, Guidance)
