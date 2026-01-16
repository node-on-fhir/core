ValueSet: IMMZD2DTDTPPregnancyStartingWith3DosesVS
Title: "IMMZD2DTDTPPregnancyStartingWith3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTDTPPregnancyStartingWith3Doses for IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Diphtheria and tetanus vaccination schedule in pregnant women who received 3 childhood DTP doses
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Three DTP primary series doses were administered-124"]], [[Three DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No tetanus and diphtheria booster doses were administered-140"]], [[No tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is currently pregnant-27"]], [[Client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for tetanus and diphtheria booster dose-114"]], [[Client is due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One tetanus and diphtheria booster doses were administered-140"]], [[One tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered less than 4 weeks ago-132"]], [[The latest tetanus and diphtheria dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for tetanus and diphtheria booster dose-118"]], [[Client is not due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered more than 4 weeks ago-132"]], [[The latest tetanus and diphtheria dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two tetanus and diphtheria booster doses were administered-140"]], [[Two tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered less than 1 year ago-131"]], [[The latest tetanus and diphtheria dose was administered less than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered more than 1 year ago-131"]], [[The latest tetanus and diphtheria dose was administered more than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three tetanus and diphtheria booster doses were administered-140"]], [[Three tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus and diphtheria immunization schedule is complete-119"]], [[Tetanus and diphtheria immunization schedule is complete]] )