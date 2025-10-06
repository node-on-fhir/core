ValueSet: IMMZD18SDTPOnTimeStartVS
Title: "IMMZD18SDTPOnTimeStart ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SDTPOnTimeStart for IMMZ.D18.S.DTP.On-time start schedule.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Diphtheria–tetanus–pertussis (DTP) vaccination schedule, on-time start (at ≤ 12 months of age)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First DTP dose from the primary series was administered-123"]], [[First DTP dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second DTP dose from the primary series was administered-123"]], [[Second DTP dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second DTP dose from the primary series was administered-124"]], [[Second DTP dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third DTP dose from the primary series was administered. The primary DTP series has been completed-224"]], [[Third DTP dose from the primary series was administered. The primary DTP series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary DTP series has been completed-100"]], [[The primary DTP series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First tetanus and diphtheria booster dose was administered-140"]], [[First tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second tetanus and diphtheria booster dose was administered-140"]], [[Second tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260"]], [[Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary DTP series has been completed and client's age is between 1 and 6 years-154"]], [[The primary DTP series has been completed and client's age is between 1 and 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed-234"]], [[Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed]] )