ValueSet: IMMZD18SDTPDelayedOrInterruptedSeriesVS
Title: "IMMZD18SDTPDelayedOrInterruptedSeries ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SDTPDelayedOrInterruptedSeries for IMMZ.D18.S.DTP.Delayed or interrupted schedule.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Diphtheria–tetanus–pertussis (DTP) vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No DTP doses were administered and client's age is more than 1 year-129"]], [[No DTP doses were administered and client's age is more than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First DTP dose from the primary series was administered-123"]], [[First DTP dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second DTP dose from the primary series was administered-123"]], [[Second DTP dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third DTP dose from the primary series was administered. The primary DTP series has been completed-224"]], [[Third DTP dose from the primary series was administered. The primary DTP series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary DTP series has been completed-100"]], [[The primary DTP series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First tetanus and diphtheria booster dose was administered-140"]], [[First tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260"]], [[Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary DTP series has been completed and client's age is between 1 year and 6 years-154"]], [[The primary DTP series has been completed and client's age is between 1 year and 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed-234"]], [[Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed]] )