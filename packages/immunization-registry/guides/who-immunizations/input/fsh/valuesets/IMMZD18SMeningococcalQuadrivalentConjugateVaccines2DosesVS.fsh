ValueSet: IMMZD18SMeningococcalQuadrivalentConjugateVaccines2DosesVS
Title: "IMMZD18SMeningococcalQuadrivalentConjugateVaccines2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeningococcalQuadrivalentConjugateVaccines2Doses for IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule.
Business rule: Determine if the client is due for a meningococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Quadrivalent conjugate vaccine (A,C,W135,Y-D), 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First meningococcal dose from the primary series was administered-84"]], [[First meningococcal dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second meningococcal dose from the primary series was administered. The primary series has been completed-99"]], [[Second meningococcal dose from the primary series was administered. The primary series has been completed]] )