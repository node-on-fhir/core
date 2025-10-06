ValueSet: IMMZD2DTMumpsVS
Title: "IMMZD2DTMumps ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMumps for IMMZ.D2.DT.Mumps.
Business rule: Determine if the client is due for a mumps vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2-dose schedule (countries with mumps in schedule and low transmission of measles)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 12 months-42"]], [[Client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for mumps vaccination-48"]], [[Client is not due for mumps vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No mumps primary series doses were administered-125"]], [[No mumps primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 12 months-42"]], [[Client's age is more than or equal to 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the past 4 weeks-92"]], [[Live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the past 4 weeks-92"]], [[No live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for mumps vaccination-44"]], [[Client is due for mumps vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One mumps primary series dose was administered-125"]], [[One mumps primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest mumps dose was administered less than 4 weeks ago-108"]], [[The latest mumps dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest mumps dose was administered more than 4 weeks ago-108"]], [[The latest mumps dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two mumps primary series doses were administered-125"]], [[Two mumps primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Mumps immunization schedule is complete-153"]], [[Mumps immunization schedule is complete]] )