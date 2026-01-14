ValueSet: IMMZD2DTYellowfeverYellowFeverVS
Title: "IMMZD2DTYellowfeverYellowFever ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTYellowfeverYellowFever for IMMZ.D2.DT.Yellow fever.
Business rule: Determine if the client is due for a yellow fever vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) in any
Table: IMMZ.D2.DT.Yellow fever
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No yellow fever primary series doses were administered-121"]], [[No yellow fever primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 months-41"]], [[Client's age is less than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for yellow fever vaccination-48"]], [[Client is not due for yellow fever vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 months-41"]], [[Client's age is more than or equal to 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the past 4 weeks-92"]], [[Live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the past 4 weeks-92"]], [[No live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for yellow fever vaccination-44"]], [[Client is due for yellow fever vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One yellow fever primary series dose was administered-121"]], [[One yellow fever primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Yellow fever immunization schedule is complete-148"]], [[Yellow fever immunization schedule is complete]] )