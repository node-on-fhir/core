ValueSet: IMMZD18STyphoidViPSVS
Title: "IMMZD18STyphoidViPS ValueSet for Decision Table"
Description: """
ValueSet IMMZD18STyphoidViPS for IMMZ.D18.S.Typhoid.ViPS schedule.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Unconjugated Vi polysaccharide (ViPS), 1 dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One typhoid dose from the primary series was administered. The primary series has been completed-93"]], [[One typhoid dose from the primary series was administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed-93"]], [[The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Typhoid booster dose was administered less than 3 years ago-225"]], [[Typhoid booster dose was administered less than 3 years ago]] )