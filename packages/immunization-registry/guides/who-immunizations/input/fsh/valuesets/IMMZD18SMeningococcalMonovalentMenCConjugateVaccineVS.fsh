ValueSet: IMMZD18SMeningococcalMonovalentMenCConjugateVaccineVS
Title: "IMMZD18SMeningococcalMonovalentMenCConjugateVaccine ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeningococcalMonovalentMenCConjugateVaccine for IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Monovalent MenC conjugate schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First meningococcal dose from the primary series was administered-338"]], [[First meningococcal dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months-237"]], [[First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months-99"]], [[Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed and client started the series when client's age was less than or equal to 11 months-236"]], [[The primary series has been completed and client started the series when client's age was less than or equal to 11 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed-120"]], [[Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed]] )