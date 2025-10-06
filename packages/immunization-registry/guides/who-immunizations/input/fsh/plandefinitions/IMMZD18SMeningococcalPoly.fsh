
Instance: IMMZD18SMeningococcalPoly
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule"
Description: """
IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule
Polysaccharide vaccines, 1-dose and booster dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalPoly, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Polysaccharide vaccines should be administered to individuals aged ≥ 2 years.
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Meningococcal booster dose]], [["""
Provision of the meningococcal booster dose
Trigger event: Primary series has been completed
"Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
Create condition: One booster 3–5 years after the primary dose may be given to persons considered to be a continued high risk of exposure, including some health workers.
"""]], [[Meningococcal booster dose]], [[Meningococcal booster dose Create]])
