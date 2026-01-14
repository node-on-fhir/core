ValueSet: IMMZD18STyphoidTy21aVS
Title: "IMMZD18STyphoidTy21a ValueSet for Decision Table"
Description: """
ValueSet IMMZD18STyphoidTy21a for IMMZ.D18.S.Typhoid.Ty21a schedule.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live attenuated Ty21a vaccine, 3-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed-93"]], [[The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The booster series has been completed-81"]], [[The booster series has been completed]] )