ValueSet: IMMZD2DTMeningococcalMenAConjugateVaccine1DoseVS
Title: "IMMZD2DTMeningococcalMenAConjugateVaccine1Dose ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeningococcalMenAConjugateVaccine1Dose for IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: MenA conjugate vaccine, 1-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 months-41"]], [[Client's age is less than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for meningococcal vaccination-48"]], [[Client is not due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No meningococcal primary series dose was administered-122"]], [[No meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 9 months-41"]], [[Client's age is more than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for meningococcal vaccination-44"]], [[Client is due for meningococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal primary series dose was administered-122"]], [[One meningococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal immunization schedule is complete-149"]], [[Meningococcal immunization schedule is complete]] )