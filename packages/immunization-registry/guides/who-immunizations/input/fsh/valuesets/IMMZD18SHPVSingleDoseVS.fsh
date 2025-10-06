ValueSet: IMMZD18SHPVSingleDoseVS
Title: "IMMZD18SHPVSingleDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SHPVSingleDose for IMMZ.D18.S.Single-dose schedule.
Business rule: Determine if the client is due for a human papillomavirus (HPV) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Alternative single-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First HPV dose from the primary series was administered-74"]], [[First HPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-140"]], [[First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second HPV dose from the primary series was administered-74"]], [[Second HPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-140"]], [[Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third HPV dose from the primary series was administered-74"]], [[Third HPV dose from the primary series was administered]] )