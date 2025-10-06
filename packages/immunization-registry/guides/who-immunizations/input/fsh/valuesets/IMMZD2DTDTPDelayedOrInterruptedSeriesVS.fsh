ValueSet: IMMZD2DTDTPDelayedOrInterruptedSeriesVS
Title: "IMMZD2DTDTPDelayedOrInterruptedSeries ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTDTPDelayedOrInterruptedSeries for IMMZ.D2.DT.DTP.Delayed or interrupted series.
Business rule: Determine if the client is due for a diphtheria–tetanus–pertussis (DTP) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No DTP primary series doses were administered-124"]], [[No DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 1 year-39"]], [[Client's age is more than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for DTP vaccination-95"]], [[Client is due for DTP vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One DTP primary series dose was administered-124"]], [[One DTP primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered less than 4 weeks ago-113"]], [[The latest DTP dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for DTP vaccination-99"]], [[Client is not due for DTP vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered more than 4 weeks ago-113"]], [[The latest DTP dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two DTP primary series doses were administered-124"]], [[Two DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered less than 6 months ago-114"]], [[The latest DTP dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered more than 6 months ago-114"]], [[The latest DTP dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three DTP primary series doses were administered-123"]], [[Three DTP primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No tetanus and diphtheria booster doses were administered-141"]], [[No tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered less than 1 year ago-112"]], [[The latest DTP dose was administered less than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose-219"]], [[Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest DTP dose was administered more than 1 year ago-112"]], [[The latest DTP dose was administered more than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose-215"]], [[Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One tetanus and diphtheria booster dose was administered-140"]], [[One tetanus and diphtheria booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered less than 1 year ago-131"]], [[The latest tetanus and diphtheria dose was administered less than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for tetanus and diphtheria booster dose-118"]], [[Client is not due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest tetanus and diphtheria dose was administered more than 1 year ago-131"]], [[The latest tetanus and diphtheria dose was administered more than 1 year ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for tetanus and diphtheria booster dose-114"]], [[Client is due for tetanus and diphtheria booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two tetanus and diphtheria booster doses were administered-140"]], [[Two tetanus and diphtheria booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus and diphtheria immunization schedule is complete-119"]], [[Tetanus and diphtheria immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No pertussis booster doses were administered-126"]], [[No pertussis booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 1 year and 6 years-49"]], [[Client's age is between 1 year and 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is not due for pertussis booster dose-206"]], [[Primary DTP series is complete. Client is not due for pertussis booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary DTP series is complete. Client is due for pertussis booster dose-202"]], [[Primary DTP series is complete. Client is due for pertussis booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 6 years-40"]], [[Client's age is more than 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pertussis immunization schedule is complete-106"]], [[Pertussis immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One pertussis booster dose was administered-126"]], [[One pertussis booster dose was administered]] )