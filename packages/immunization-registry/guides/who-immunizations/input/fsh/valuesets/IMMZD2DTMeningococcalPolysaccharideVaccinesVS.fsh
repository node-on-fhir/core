ValueSet: IMMZD2DTMeningococcalPolysaccharideVaccinesVS
Title: "IMMZD2DTMeningococcalPolysaccharideVaccines ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeningococcalPolysaccharideVaccines for IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccines)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 2 years-40"]], [[Client's age is less than 2 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for meningococcal vaccination-48"]], [[Client is not due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No meningococcal primary series dose was administered-122"]], [[No meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 2 years-40"]], [[Client's age is more than 2 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for meningococcal vaccination-44"]], [[Client is due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal primary series dose was administered-122"]], [[One meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered less than 3 years ago-105"]], [[The latest meningococcal dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series is complete. Client is not due for meningococcal booster dose.-148"]], [[The primary series is complete. Client is not due for meningococcal booster dose.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered more than 3 years ago-105"]], [[The latest meningococcal dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No meningococcal booster dose was administered-120"]], [[No meningococcal booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note-166"]], [[The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal booster dose was administered-120"]], [[Meningococcal booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal immunization schedule is complete-49"]], [[Meningococcal immunization schedule is complete]] )