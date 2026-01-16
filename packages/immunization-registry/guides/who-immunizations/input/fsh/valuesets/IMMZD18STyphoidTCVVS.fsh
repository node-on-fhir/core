ValueSet: IMMZD18STyphoidTCVVS
Title: "IMMZD18STyphoidTCV ValueSet for Decision Table"
Description: """
ValueSet IMMZD18STyphoidTCV for IMMZ.D18.S.Typhoid.TCV schedule.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Typhoid conjugate vaccine (TCV), 1 dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One typhoid dose from primary series was administered. The primary series has been completed-93"]], [[One typhoid dose from primary series was administered. The primary series has been completed]] )