ValueSet: IMMZD2DTDTPPregnancyVS
Title: "IMMZD2DTDTPPregnancy ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTDTPPregnancy for IMMZ.D2.DT.DTP.Pregnancy.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Determine whether DTP-containing vaccines are needed for pregnant women
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No DTP primary series doses were administered-124"]], [[No DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is currently pregnant-27"]], [[Client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client should follow 'delayed or interrupted series' decision logic-0"]], [[Client should follow 'delayed or interrupted series' decision logic]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three DTP primary series doses were administered-124"]], [[Three DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No tetanus and diphtheria booster dose was administered-140"]], [[No tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client should follow 'pregnancy starting with 3 doses' decision logic-0"]], [[Client should follow 'pregnancy starting with 3 doses' decision logic]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One tetanus and diphtheria booster dose was administered-140"]], [[One tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client should follow 'pregnancy starting with 4 doses' decision logic-0"]], [[Client should follow 'pregnancy starting with 4 doses' decision logic]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two tetanus and diphtheria booster doses were administered-140"]], [[Two tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus and diphtheria immunization schedule is complete-119"]], [[Tetanus and diphtheria immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three tetanus and diphtheria booster doses were administered-140"]], [[Three tetanus and diphtheria booster doses were administered]] )