
Instance: IMMZD18SMeningococcalMenC
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule"
Description: """
IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule
Monovalent MenC conjugate schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeningococcalMenC, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 1]], [["""
Provision of the meningococcal dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: For monovalent MenC conjugate vaccine, one single intramuscular dose is recommended for children aged ≥ 12 months, teenagers and adults. Children aged 2–11 months require 2 doses administered.
"""]], [[Meningococcal dose 1]], [[Meningococcal dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Meningococcal dose 2]], [["""
Provision of the meningococcal dose 2 for clients that start the series when aged ≤ 11 months
Trigger event: First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months
Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 1 and "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" ≤ 11 months
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
Create condition: Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.
"""]], [[Meningococcal dose 2]], [[Meningococcal dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Meningococcal booster dose]], [["""
Provision of the meningococcal booster dose for clients that start the series when aged ≤ 11 months
Trigger event: The primary series has been completed and client started the series when client's age was less than or equal to 11 months
"Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE and "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines" and "Dose number" = 1) - "Date of birth" ≤ 11 months
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
Create condition: Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.
"""]], [[Meningococcal booster dose]], [[Meningococcal booster dose Create]])
