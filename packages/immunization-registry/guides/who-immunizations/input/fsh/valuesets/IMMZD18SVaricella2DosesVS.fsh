ValueSet: IMMZD18SVaricella2DosesVS
Title: "IMMZD18SVaricella2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SVaricella2Doses for IMMZ.D18.S.Varicella.2-dose schedule.
Business rule: Determine if the client is due for a varicella vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First varicella dose from the primary series was administered-128"]], [[First varicella dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second varicella dose from the primary series was administered. The primary series has been completed-107"]], [[Second varicella dose from the primary series was administered. The primary series has been completed]] )