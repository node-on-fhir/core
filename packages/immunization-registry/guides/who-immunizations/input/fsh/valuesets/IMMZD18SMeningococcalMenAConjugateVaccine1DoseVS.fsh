ValueSet: IMMZD18SMeningococcalMenAConjugateVaccine1DoseVS
Title: "IMMZD18SMeningococcalMenAConjugateVaccine1Dose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeningococcalMenAConjugateVaccine1Dose for IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: MenA conjugate vaccine, 1-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One meningococcal dose from the primary series was administered. The primary series has been completed-99"]], [[One meningococcal dose from the primary series was administered. The primary series has been completed]] )