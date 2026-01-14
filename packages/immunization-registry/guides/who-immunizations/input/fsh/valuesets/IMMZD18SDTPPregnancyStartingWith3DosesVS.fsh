ValueSet: IMMZD18SDTPPregnancyStartingWith3DosesVS
Title: "IMMZD18SDTPPregnancyStartingWith3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SDTPPregnancyStartingWith3Doses for IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood diphtheria–tetanus–pertussis (DTP) doses
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary DTP series has been completed and client is currently pregnant-132"]], [[The primary DTP series has been completed and client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First tetanus and diphtheria booster dose was administered-140"]], [[First tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second tetanus and diphtheria booster dose was administered-140"]], [[Second tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260"]], [[Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed]] )