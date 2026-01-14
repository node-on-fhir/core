
Instance: IMMZD18SRotavirus
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Rotavirus schedule"
Description: """
IMMZ.D18.S.Rotavirus schedule
IMMZ.D18.S.Rotavirus schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SRotavirus, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Rotavirus dose 1]], [["""
Provision of the rotavirus first dose
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: WHO recommends that the first dose of rotavirus vaccine be administered as soon as possible after 6 weeks of age.
"""]], [[Rotavirus dose 1]], [[Rotavirus dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Rotavirus dose 2]], [["""
Provision of the rotavirus second dose
Trigger event: First rotavirus dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" where "Vaccine type" = "Rotavirus vaccines"
Create condition: A minimum interval of 4 weeks should be maintained between doses.
"""]], [[Rotavirus dose 2]], [[Rotavirus dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Rotavirus dose 3]], [["""
Provision of a rotavirus third dose
Trigger event: For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered
Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines"and "Type of dose" = "Primary series" ) = 2 
AND "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 1) ≠ "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 2) OR "Total doses in series" > 2
Trigger date: Latest "Date and time of vaccination" where "Vaccine type" = "Rotavirus vaccines"
Create condition: For a mixed series or a series with any unknown vaccine products, a total of 3 doses of rotavirus vaccine should be administered for a complete vaccination series.
RotaTeq, Rotavac and Rotasiil should be administered in a 3-dose schedule.
"""]], [[Rotavirus dose 3]], [[Rotavirus dose 3 Create]])
