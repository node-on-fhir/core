ValueSet: IMMZD2DTDTPOnTimeStartVS
Title: "IMMZD2DTDTPOnTimeStart ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTDTPOnTimeStart for IMMZ.D2.DT.DTP.On-time start.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: DTP vaccination schedule, on-time start (at ≤ 12 months of age)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 weeks-40"]], [[Client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for DTP vaccination-99"]], [[Client is not due for DTP vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No DTP primary series doses were administered-123"]], [[No DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and 1 year-49"]], [[Client's age is between 6 weeks and 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for DTP vaccination-95"]], [[Client is due for DTP vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One DTP primary series dose was administered-123"]], [[One DTP primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered less than 4 weeks ago-113"]], [[The latest DTP dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered more than 4 weeks ago-113"]], [[The latest DTP dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two DTP primary series doses were administered-123"]], [[Two DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three DTP primary series doses were administered-123"]], [[Three DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No tetanus and diphtheria booster doses were administered-140"]], [[No tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 12 months-42"]], [[Client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose-218"]], [[Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 12 months-42"]], [[Client's age is more than or equal to 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose-215"]], [[Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One tetanus and diphtheria booster dose was administered-140"]], [[One tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 4 years-40"]], [[Client's age is less than 4 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for tetanus and diphtheria booster dose-118"]], [[Client is not due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 4 years-40"]], [[Client's age is more than or equal to 4 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for tetanus and diphtheria booster dose-114"]], [[Client is due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two tetanus and diphtheria booster doses were administered-140"]], [[Two tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 years-40"]], [[Client's age is less than 9 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 years-40"]], [[Client's age is more than or equal to 9 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three tetanus and diphtheria booster doses were administered-140"]], [[Three tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus and diphtheria immunization schedule is complete-119"]], [[Tetanus and diphtheria immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No pertussis booster doses were administered-127"]], [[No pertussis booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 1 year-39"]], [[Client's age is less than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for pertussis booster dose-48"]], [[Client is not due for pertussis booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 1 year and 6 years-49"]], [[Client's age is between 1 year and 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered less than 6 months ago-114"]], [[The latest DTP dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is not due for pertussis booster dose-206"]], [[Primary DTP series is complete. Client is not due for pertussis booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered more than 6 months ago-114"]], [[The latest DTP dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is due for pertussis booster dose-202"]], [[Primary DTP series is complete. Client is due for pertussis booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 6 years-40"]], [[Client's age is more than 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pertussis immunization schedule is complete-106"]], [[Pertussis immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One pertussis booster dose was administered-127"]], [[One pertussis booster dose was administered]] )