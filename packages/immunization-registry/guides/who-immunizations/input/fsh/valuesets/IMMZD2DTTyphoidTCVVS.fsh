ValueSet: IMMZD2DTTyphoidTCVVS
Title: "IMMZD2DTTyphoidTCV ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTTyphoidTCV for IMMZ.D2.DT.Typhoid.TCV.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Typhoid conjugate vaccine (TCV) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 months-41"]], [[Client's age is less than 6 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Typhoid vaccination-48"]], [[Client is not due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No typhoid primary series doses were administered-116"]], [[No typhoid primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 months and 45 years-52"]], [[Client's age is between 6 months and 45 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Typhoid vaccination-44"]], [[Client is due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 45 years-41"]], [[Client's age is more than or equal to 45 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One typhoid primary series dose was administered-116"]], [[One typhoid primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Typhoid immunization schedule is complete-143"]], [[Typhoid immunization schedule is complete]] )