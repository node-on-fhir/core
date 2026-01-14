ValueSet: IMMZD18SHib3DosesVS
Title: "IMMZD18SHib3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SHib3Doses for IMMZ.D18.S.Hib.3 doses schedule.
Business rule: Determine if the client is due for a Haemophilus influenzae type b (Hib) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 3 primary doses without a booster dose (3p) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First Hib dose from the primary series was administered-279"]], [[First Hib dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years-302"]], [[First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second Hib dose from the primary series was administered-122"]], [[Second Hib dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second Hib dose from the primary series was administered. Client's age is less than 5 years-167"]], [[Second Hib dose from the primary series was administered. Client's age is less than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third Hib dose from the primary series was administered. The primary series has been completed-100"]], [[Third Hib dose from the primary series was administered. The primary series has been completed]] )