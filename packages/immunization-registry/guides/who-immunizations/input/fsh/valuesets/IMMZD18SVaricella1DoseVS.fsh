ValueSet: IMMZD18SVaricella1DoseVS
Title: "IMMZD18SVaricella1Dose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SVaricella1Dose for IMMZ.D18.S.Varicella.1-dose schedule.
Business rule: Determine if the client is due for a varicella vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 1-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One varicella dose from primary series was administered. The primary series has been completed-106"]], [[One varicella dose from primary series was administered. The primary series has been completed]] )