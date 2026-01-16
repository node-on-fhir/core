ValueSet: IMMZD18SHib2DosesWithBoosterDoseVS
Title: "IMMZD18SHib2DosesWithBoosterDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SHib2DosesWithBoosterDose for IMMZ.D18.S.Hib.2 doses with booster dose schedule.
Business rule: Determine if the client is due for a Haemophilus influenzae type b (Hib) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2 primary doses with a booster dose (2p+1) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First Hib dose from the primary series was administered-279"]], [[First Hib dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years-302"]], [[First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second Hib dose from the primary series was administered. The primary series has been completed-99"]], [[Second Hib dose from the primary series was administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second Hib dose from the primary series was administered. Client's age is less than 5 years-167"]], [[Second Hib dose from the primary series was administered. Client's age is less than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One Hib booster dose was administered. Hib immunization schedule has been completed-120"]], [[One Hib booster dose was administered. Hib immunization schedule has been completed]] )