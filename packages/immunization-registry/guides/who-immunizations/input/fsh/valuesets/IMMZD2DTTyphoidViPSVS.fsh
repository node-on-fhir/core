ValueSet: IMMZD2DTTyphoidViPSVS
Title: "IMMZD2DTTyphoidViPS ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTTyphoidViPS for IMMZ.D2.DT.Typhoid.ViPS.
Business rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Unconjugated Vi polysaccharide (ViPS) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 2 years-40"]], [[Client's age is less than 2 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Typhoid vaccination-48"]], [[Client is not due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No typhoid primary series doses were administered-116"]], [[No typhoid primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 2 years-40"]], [[Client's age is more than or equal to 2 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Typhoid vaccination-44"]], [[Client is due for Typhoid vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One typhoid primary series dose was administered-116"]], [[One typhoid primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest typhoid dose was administered less than 3 years ago-106"]], [[The latest typhoid dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is not due for typhoid booster dose-142"]], [[Primary series is complete. Client is not due for typhoid booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest typhoid dose was administered more than 3 years ago-106"]], [[The latest typhoid dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is due for typhoid booster dose-138"]], [[Primary series is complete. Client is due for typhoid booster dose]] )