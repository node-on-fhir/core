ValueSet: IMMZD18SMeningococcalPolysaccharideVaccinesVS
Title: "IMMZD18SMeningococcalPolysaccharideVaccines ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeningococcalPolysaccharideVaccines for IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Polysaccharide vaccines, 1-dose and booster dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal dose from primary series was administered. The primary series has been completed-99"]], [[One meningococcal dose from primary series was administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series has been completed-99"]], [[Primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal booster dose was administered. The immunization schedule has been completed-120"]], [[Meningococcal booster dose was administered. The immunization schedule has been completed]] )