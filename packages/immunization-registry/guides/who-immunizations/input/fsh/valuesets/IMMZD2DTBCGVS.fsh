ValueSet: IMMZD2DTBCGVS
Title: "IMMZD2DTBCG ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTBCG for IMMZ.D2.DT.BCG.
Business rule: Determine if the client is due for a bacille Calmette–Guérin (BCG) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: IMMZ.D2.DT.BCG
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No BCG primary series dose was administered-112"]], [[No BCG primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than or equal to 28 days-40"]], [[Client's age is less than or equal to 28 days]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is negative or unknown-29"]], [[Client's HIV status is negative or unknown]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered-90"]], [[No live vaccine was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for BCG vaccination-44"]], [[Client is due for BCG vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last four weeks-92"]], [[Live vaccine was administered in the last four weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for BCG vaccination-48"]], [[Client is not due for BCG vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is positive-29"]], [[Client's HIV status is positive]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is currently receiving antiretroviral therapy-25"]], [[Client is currently receiving antiretroviral therapy]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is immunologically stable-31"]], [[Client is immunologically stable]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not immunologically stable-32"]], [[Client is not immunologically stable]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is currently not receiving antiretroviral therapy-26"]], [[Client is currently not receiving antiretroviral therapy]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 28 days and 5 years-50"]], [[Client's age is between 28 days and 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's TB infection test result is negative-39"]], [[Client's TB infection test result is negative]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last four weeks-92"]], [[No live vaccine was administered in the last four weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's TB infection test result is unknown (test not done or no result yet)-34"]], [[Client's TB infection test result is unknown (test not done or no result yet)]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create clinical note.-66"]], [[Clinical judgement is required. Create clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's TB infection test result is positive-39"]], [[Client's TB infection test result is positive]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not clinically well-25"]], [[Client is not clinically well]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is clinically well-24"]], [[Client is clinically well]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 5 years-40"]], [[Client's age is more than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create clinical note.-67"]], [[Clinical judgement is required. Create clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One BCG primary series dose was administered-112"]], [[One BCG primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"BCG immunization schedule is complete-140"]], [[BCG immunization schedule is complete]] )