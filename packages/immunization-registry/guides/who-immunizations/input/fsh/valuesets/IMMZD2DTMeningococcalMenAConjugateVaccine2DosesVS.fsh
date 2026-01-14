ValueSet: IMMZD2DTMeningococcalMenAConjugateVaccine2DosesVS
Title: "IMMZD2DTMeningococcalMenAConjugateVaccine2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeningococcalMenAConjugateVaccine2Doses for IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 3 months-41"]], [[Client's age is less than 3 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for meningococcal vaccination-48"]], [[Client is not due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No meningococcal primary series dose was administered-122"]], [[No meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 3 months-41"]], [[Client's age is more than or equal to 3 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for meningococcal vaccination-44"]], [[Client is due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal primary series dose was administered-122"]], [[One meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered less than 8 weeks ago-105"]], [[The latest meningococcal dose was administered less than 8 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest meningococcal dose was administered more than 8 weeks ago-105"]], [[The latest meningococcal dose was administered more than 8 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two meningococcal primary series doses were administered-122"]], [[Two meningococcal primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal immunization schedule is complete-149"]], [[Meningococcal immunization schedule is complete]] )