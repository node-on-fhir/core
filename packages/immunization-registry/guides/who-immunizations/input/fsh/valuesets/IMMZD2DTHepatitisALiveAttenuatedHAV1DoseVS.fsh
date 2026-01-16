ValueSet: IMMZD2DTHepatitisALiveAttenuatedHAV1DoseVS
Title: "IMMZD2DTHepatitisALiveAttenuatedHAV1Dose ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTHepatitisALiveAttenuatedHAV1Dose for IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose.
Business rule: Determine if the client is due for a hepatitis A vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live attenuated hepatitis A virus (HAV), 1 dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 18 months-42"]], [[Client's age is less than 18 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Hepatitis A vaccination-48"]], [[Client is not due for Hepatitis A vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No hepatitis A primary series dose was administered-131"]], [[No hepatitis A primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 18 months-42"]], [[Client's age is more than or equal to 18 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Hepatitis A vaccination-44"]], [[Client is due for Hepatitis A vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One hepatitis A primary series dose was administered-131"]], [[One hepatitis A primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Hepatitis A immunization schedule is complete-158"]], [[Hepatitis A immunization schedule is complete]] )