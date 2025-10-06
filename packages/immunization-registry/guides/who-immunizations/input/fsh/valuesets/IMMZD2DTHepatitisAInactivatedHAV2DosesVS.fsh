ValueSet: IMMZD2DTHepatitisAInactivatedHAV2DosesVS
Title: "IMMZD2DTHepatitisAInactivatedHAV2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTHepatitisAInactivatedHAV2Doses for IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses.
Business rule: Determine if the client is due for a hepatitis A vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Inactivated hepatitis A virus (HAV), 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 12 months-42"]], [[Client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Hepatitis A vaccination-48"]], [[Client is not due for Hepatitis A vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No hepatitis A primary series doses were administered-131"]], [[No hepatitis A primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 12 months-42"]], [[Client's age is more than or equal to 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Hepatitis A vaccination-44"]], [[Client is due for Hepatitis A vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One hepatitis A primary series dose was administered-131"]], [[One hepatitis A primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest Hepatitis A dose was administered less than 6 months ago-115"]], [[The latest Hepatitis A dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest Hepatitis A dose was administered more than 6 months ago-115"]], [[The latest Hepatitis A dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two hepatitis A primary series doses were administered-131"]], [[Two hepatitis A primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Hepatitis A immunization schedule is complete-158"]], [[Hepatitis A immunization schedule is complete]] )