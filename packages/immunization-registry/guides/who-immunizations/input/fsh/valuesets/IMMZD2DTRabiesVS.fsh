ValueSet: IMMZD2DTRabiesVS
Title: "IMMZD2DTRabies ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTRabies for IMMZ.D2.DT.Rabies.
Business rule: Determine if the client is due for a rabies vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No rabies primary series doses were administered-115"]], [[No rabies primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for rabies vaccination-44"]], [[Client is due for rabies vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One rabies primary series doses were administered-115"]], [[One rabies primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest rabies dose was administered less than 7 days ago-97"]], [[The latest rabies dose was administered less than 7 days ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for rabies vaccination-48"]], [[Client is not due for rabies vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest rabies dose was administered more than 7 days ago-97"]], [[The latest rabies dose was administered more than 7 days ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two rabies primary series doses were administered-115"]], [[Two rabies primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rabies immunization schedule is complete-142"]], [[Rabies immunization schedule is complete]] )