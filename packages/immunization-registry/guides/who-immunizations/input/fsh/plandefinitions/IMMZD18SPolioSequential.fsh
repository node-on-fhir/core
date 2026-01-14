
Instance: IMMZD18SPolioSequential
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule"
Description: """
IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule
Sequential bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPolioSequential, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[IPV dose 1]], [["""
Provision of IPV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.
"""]], [[IPV dose 1]], [[IPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[IPV dose 2]], [["""
Provision of IPV dose 2
Trigger event: First IPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 1
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
Create condition: For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.
"""]], [[IPV dose 2]], [[IPV dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[bOPV dose 1]], [["""
Provision of bOPV dose 1
Trigger event: Second IPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 2
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
Create condition: Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.
"""]], [[bOPV dose 1]], [[bOPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[bOPV dose 2]], [["""
Provision of bOPV dose 2
Trigger event: First bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "bOPV") = 1
Trigger date: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
Create condition: Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.
"""]], [[bOPV dose 2]], [[bOPV dose 2 Create]])
