ValueSet: IMMZD18SBCGVS
Title: "IMMZD18SBCG ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SBCG for IMMZ.D18.S.BCG schedule.
Business rule: Determine if the client is due for a bacille Calmette–Guérin (BCG) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: IMMZ.D18.S.BCG schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One BCG dose from the primary series was administered. The primary series has been completed-89"]], [[One BCG dose from the primary series was administered. The primary series has been completed]] )