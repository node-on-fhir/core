
Instance: IMMZD18SDTPPregnant4
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule"
Description: """
IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule
Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood diphtheria–tetanus–pertussis (DTP) doses
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SDTPPregnant4, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)]], [["""
Provision of tetanus and diphtheria booster dose 2 for pregnant women who received 4 tetanus-containing vaccines doses during childhood or pre-adulthood
Trigger event: The primary DTP series has been completed, first tetanus and diphtheria booster dose was administered and client is currently pregnant
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND Count of vaccines administered where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1 AND "Currently pregnant" = TRUE
Trigger date: First ANC contact date
"Contact date" WHEN "ANC contact number" = 1
Create condition: Women who received 4 tetanus-containing vaccine doses during childhood or pre-adulthood need only 1 booster dose, which should be given at the first opportunity.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 3]], [["""
Provision of tetanus and diphtheria booster dose 3 for pregnant women who received 4 tetanus-containing vaccines doses during childhood or pre-adulthood
Trigger event: Second tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
Trigger date: Latest "Date and time of vaccination" where "Vaccine type" = "Tetanus and diphtheria-containing vaccines"
Create condition: To provide lifelong protection for tetanus, a sixth dose should be provided at least 1 year after the fifth dose, or in next pregnancy.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 3]], [[Tetanus and diphtheria-containing vaccine booster dose 3 Create]])
