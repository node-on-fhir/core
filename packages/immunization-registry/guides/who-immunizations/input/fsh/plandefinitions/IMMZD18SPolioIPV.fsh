
Instance: IMMZD18SPolioIPV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Polio.IPV-only schedule"
Description: """
IMMZ.D18.S.Polio.IPV-only schedule
Inactivated polio vaccine (IPV)-only schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPolioIPV, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[IPV dose 1]], [["""
Provision of IPV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
"""]], [[IPV dose 1]], [[IPV dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[IPV dose 2]], [["""
Provision of IPV dose 2
Trigger event: First IPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
Create condition: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
"""]], [[IPV dose 2]], [[IPV dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[IPV dose 3]], [["""
Provision of IPV dose 3
Trigger event: Second IPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
Create condition: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
"""]], [[IPV dose 3]], [[IPV dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[IPV booster]], [["""
Provision of IPV booster
Trigger event: Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 3 AND "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" AND "Dose number" = 1) − "Date of birth" = 6 weeks
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
Create condition: If the primary series begins at 6 weeks, a booster dose should be given 6 months or more after the third dose
"""]], [[IPV booster]], [[IPV booster Create]])
