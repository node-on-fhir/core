ValueSet: IMMZD2DTTyphoidTy21aVS
Title: "IMMZD2DTTyphoidTy21a ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTTyphoidTy21a for IMMZ.D2.DT.Typhoid.Ty21a.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live attenuated Ty21a vaccine schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 years-40"]], [[Client's age is less than 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Typhoid vaccination-48"]], [[Client is not due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 6 years-40"]], [[Client's age is more than or equal to 6 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is not complete-93"]], [[Primary series is not complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine, other than typhoid, was administered in the past 4 weeks-132"]], [[No live vaccine, other than typhoid, was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Typhoid vaccination-44"]], [[Client is due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine, other than typhoid, was administered in the past 4 weeks-132"]], [[Live vaccine, other than typhoid, was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete-93"]], [[Primary series is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest typhoid dose was administered less than 3 years ago-106"]], [[The latest typhoid dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for typhoid booster dose-48"]], [[Client is not due for typhoid booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest typhoid dose was administered more than 3 years ago-106"]], [[The latest typhoid dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for typhoid booster dose-44"]], [[Client is due for typhoid booster dose]] )