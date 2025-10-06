ValueSet: IMMZD18SCholeraWCVaccinesVS
Title: "IMMZD18SCholeraWCVaccines ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SCholeraWCVaccines for IMMZ.D18.S.Cholera.WC vaccines schedule.
Business rule: Determine if the client is due for a cholera vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Whole-cell (WC) vaccines (Shanchol, Euvchol and mORCVAX), 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth and no cholera doses have been administered-134"]], [[Child's birth and no cholera doses have been administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose was administered-107"]], [[First cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose administered-105"]], [[First cholera dose administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed-93"]], [[The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago-204"]], [[Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera booster dose was administered-105"]], [[First cholera booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera booster dose administered-103"]], [[First cholera booster dose administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Revaccination with booster series has been completed in the last 3 years-191"]], [[Revaccination with booster series has been completed in the last 3 years]] )