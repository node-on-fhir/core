ValueSet: IMMZD18SHPV2DosesVS
Title: "IMMZD18SHPV2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SHPV2Doses for IMMZ.D18.S.HPV.2-dose schedule.
Business rule: Determine if the client is due for a human papillomavirus (HPV) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth when client's biological sex is female-34"]], [[Child's birth when client's biological sex is female]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First HPV dose from the primary series was administered-112"]], [[First HPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second HPV dose from the primary series was administered-112"]], [[Second HPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-178"]], [[Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third HPV dose from the primary series was administered-112"]], [[Third HPV dose from the primary series was administered]] )