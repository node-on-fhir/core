
Instance: IMMZD18SPoliobOPVIPV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Polio.bOPV plus IPV schedule"
Description: """
IMMZ.D18.S.Polio.bOPV plus IPV schedule
Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPoliobOPVIPV, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[bOPV dose 1]], [["""
Provision of bOPV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
"""]], [[bOPV dose 1]], [[bOPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[IPV dose 1]], [["""
Provision of IPV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The first IPV dose should be administered from a minimum of 14 weeks of age.
"""]], [[IPV dose 1]], [[IPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[bOPV dose 2]], [["""
Provision of bOPV dose 2
Trigger event: First bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 1
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
Create condition: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
"""]], [[bOPV dose 2]], [[bOPV dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[IPV dose 2]], [["""
Provision of IPV dose 2
Trigger event: First IPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 1
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
Create condition: The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 4 months later (possibly coinciding with other vaccines administered at 9 months of age).
"""]], [[IPV dose 2]], [[IPV dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[bOPV dose 3]], [["""
Provision of bOPV dose 3
Trigger event: Second bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 2
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
Create condition: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
"""]], [[bOPV dose 3]], [[bOPV dose 3 Create]])
