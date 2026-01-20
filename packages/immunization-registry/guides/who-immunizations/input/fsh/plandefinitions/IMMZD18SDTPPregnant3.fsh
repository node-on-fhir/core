
Instance: IMMZD18SDTPPregnant3
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule"
Description: """
IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule
Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood diphtheria–tetanus–pertussis (DTP) doses
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SDTPPregnant3, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 1 (during pregnancy)]], [["""
Provision of tetanus and diphtheria booster dose 1 for pregnant women who received only 3 doses of DTP during childhood without booster doses
Trigger event: The primary DTP series has been completed and client is currently pregnant
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND "Currently pregnant" = TRUE
Trigger date: "Contact date" WHEN "ANC contact number" = 1
Create condition: Pregnant women who have received only 3 doses of tetanus-containing vaccines during childhood without booster doses should receive 2 doses of tetanus-containing vaccines at the earliest opportunity during pregnancy with a minimal interval of 4 weeks between doses and the second dose at least 2 weeks before giving birth.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 1 (during pregnancy)]], [[Tetanus and diphtheria-containing vaccine booster dose 1 (during pregnancy) Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)]], [["""
Provision of tetanus and diphtheria booster dose 2 for pregnant women who received only 3 doses of DTP during childhood without booster doses
Trigger event: First tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
Trigger date: Latest "Date and time of vaccination" where "Vaccine type" = "Tetanus and diphtheria-containing vaccines"
Create condition: Pregnant women who have received only 3 doses of tetanus-containing vaccines during childhood without booster doses should receive 2 doses of tetanus-containing vaccines at the earliest opportunity during pregnancy with a minimal interval of 4 weeks between doses and the second dose at least 2 weeks before giving birth.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 3]], [["""
Provision of tetanus and diphtheria booster dose 3 for pregnant women who received only 3 doses of DTP during childhood without booster doses
Trigger event: Second tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
Trigger date: Latest "Date and time of vaccination" where "Vaccine type" = "Tetanus and diphtheria-containing vaccines"
Create condition: A sixth dose would be needed at least 1 year after the fifth dose, or during the next pregnancy.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 3]], [[Tetanus and diphtheria-containing vaccine booster dose 3 Create]])
