ValueSet: IMMZD2DTRubellaHighIncidenceVS
Title: "IMMZD2DTRubellaHighIncidence ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTRubellaHighIncidence for IMMZ.D2.DT.Rubella.High incidence.
Business rule: Determine if the client is due for a rubella vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Countries with high incidence and mortality from rubella
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 months-41"]], [[Client's age is less than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for rubella vaccination-48"]], [[Client is not due for rubella vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No rubella primary series dose was administered-127"]], [[No rubella primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 months-41"]], [[Client's age is more than or equal to 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for rubella vaccination-44"]], [[Client is due for rubella vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One rubella primary series dose was administered-127"]], [[One rubella primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rubella immunization schedule is complete-154"]], [[Rubella immunization schedule is complete]] )