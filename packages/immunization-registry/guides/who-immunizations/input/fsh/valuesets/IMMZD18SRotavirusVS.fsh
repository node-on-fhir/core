ValueSet: IMMZD18SRotavirusVS
Title: "IMMZD18SRotavirus ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SRotavirus for IMMZ.D18.S.Rotavirus schedule.
Business rule: Determine if the client is due for a rotavirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: IMMZ.D18.S.Rotavirus schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First rotavirus dose from the primary series was administered-118"]], [[First rotavirus dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second rotavirus dose from the primary series was administered-118"]], [[Second rotavirus dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered-324"]], [[For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third rotavirus dose from the primary series was administered-118"]], [[Third rotavirus dose from the primary series was administered]] )