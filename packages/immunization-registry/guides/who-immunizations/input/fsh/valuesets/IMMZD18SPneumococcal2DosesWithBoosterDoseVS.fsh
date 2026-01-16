ValueSet: IMMZD18SPneumococcal2DosesWithBoosterDoseVS
Title: "IMMZD18SPneumococcal2DosesWithBoosterDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPneumococcal2DosesWithBoosterDose for IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule.
Business rule: Determine if the client is due for a pneumococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2 primary doses with a booster dose (2p+1) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First pneumococcal dose from the primary series was administered-121"]], [[First pneumococcal dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection-333"]], [[First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second pneumococcal dose from the primary series was administered. The primary series has been completed.-99"]], [[Second pneumococcal dose from the primary series was administered. The primary series has been completed.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth-276"]], [[Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pneumococcal booster dose was administered-119"]], [[Pneumococcal booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth-453"]], [[The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second pneumococcal booster dose was administered-119"]], [[Second pneumococcal booster dose was administered]] )