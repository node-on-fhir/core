ValueSet: IMMZD18SMalariaVS
Title: "IMMZD18SMalaria ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMalaria for IMMZ.D18.S.Malaria schedule.
Business rule: Determine if the client is due for a malaria vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 4-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First malaria dose from the primary series was administered-116"]], [[First malaria dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second malaria dose from the primary series was administered-116"]], [[Second malaria dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third malaria dose from the primary series was administered-116"]], [[Third malaria dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Fourth malaria dose from the primary series was administered. The primary series has been completed-94"]], [[Fourth malaria dose from the primary series was administered. The primary series has been completed]] )