ValueSet: IMMZD18SPneumococcal3DosesVS
Title: "IMMZD18SPneumococcal3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPneumococcal3Doses for IMMZ.D18.S.Pneumococcal.3 doses schedule.
Business rule: Determine if the client is due for a pneumococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 3 primary doses (3p+0) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First pneumococcal dose from the primary series was administered-121"]], [[First pneumococcal dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth-280"]], [[First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second pneumococcal dose from the primary series was administered-121"]], [[Second pneumococcal dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection.-333"]], [[First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth.-302"]], [[Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third pneumococcal dose from the primary series was administered. The primary series has been completed.-98"]], [[Third pneumococcal dose from the primary series was administered. The primary series has been completed.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth.-351"]], [[Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One pneumococcal booster dose was administered.-119"]], [[One pneumococcal booster dose was administered.]] )