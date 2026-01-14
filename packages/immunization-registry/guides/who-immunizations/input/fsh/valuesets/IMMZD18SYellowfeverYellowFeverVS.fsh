ValueSet: IMMZD18SYellowfeverYellowFeverVS
Title: "IMMZD18SYellowfeverYellowFever ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SYellowfeverYellowFever for IMMZ.D18.S.Yellow fever schedule.
Business rule: Determine if the client is due for a yellow fever vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) in any
Table: IMMZ.D18.S.Yellow fever schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One yellow fever dose from primary series was administered. The primary series has been completed-98"]], [[One yellow fever dose from primary series was administered. The primary series has been completed]] )