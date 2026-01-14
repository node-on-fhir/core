ValueSet: IMMZD18SMumpsVS
Title: "IMMZD18SMumps ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMumps for IMMZ.D18.S.Mumps schedule.
Business rule: Determine if the client is due for a mumps vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First mumps dose from the primary series was administered-125"]], [[First mumps dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second mumps dose from the primary series was administered. The primary series has been completed-103"]], [[Second mumps dose from the primary series was administered. The primary series has been completed]] )