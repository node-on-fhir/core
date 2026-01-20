ValueSet: IMMZD2DTMeningococcalQuadrivalentConjugateVaccines2DosesVS
Title: "IMMZD2DTMeningococcalQuadrivalentConjugateVaccines2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeningococcalQuadrivalentConjugateVaccines2Doses for IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Quadrivalent conjugate vaccines (A,C,W135,Y-D), 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 months-41"]], [[Client's age is less than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for meningococcal vaccination-48"]], [[Client is not due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No meningococcal primary series dose was administered-122"]], [[No meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 months-41"]], [[Client's age is more than or equal to 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for meningococcal vaccination-44"]], [[Client is due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal primary series dose was administered-122"]], [[One meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was less than or equal to 23 months when the primary series was started-110"]], [[Client's age was less than or equal to 23 months when the primary series was started]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered less than 3 months ago-106"]], [[The latest meningococcal dose was administered less than 3 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered more than 3 months ago-106"]], [[The latest meningococcal dose was administered more than 3 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was more than 23 months when the primary series was started-110"]], [[Client's age was more than 23 months when the primary series was started]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal immunization schedule is complete-149"]], [[Meningococcal immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two meningococcal primary series doses were administered-122"]], [[Two meningococcal primary series doses were administered]] )