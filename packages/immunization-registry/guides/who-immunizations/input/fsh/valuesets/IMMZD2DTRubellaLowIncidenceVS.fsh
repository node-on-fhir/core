ValueSet: IMMZD2DTRubellaLowIncidenceVS
Title: "IMMZD2DTRubellaLowIncidence ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTRubellaLowIncidence for IMMZ.D2.DT.Rubella.Low incidence.
Business rule: Determine if the client is due for a rubella vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Countries with low incidence of rubella
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 12 months-42"]], [[Client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for rubella vaccination-48"]], [[Client is not due for rubella vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No rubella primary series dose was administered-127"]], [[No rubella primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 12 months-42"]], [[Client's age is more than or equal to 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for rubella vaccination-44"]], [[Client is due for rubella vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last the 4 weeks-92"]], [[Live vaccine was administered in the last the 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One rubella primary series dose was administered-127"]], [[One rubella primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rubella immunization schedule is complete-155"]], [[Rubella immunization schedule is complete]] )