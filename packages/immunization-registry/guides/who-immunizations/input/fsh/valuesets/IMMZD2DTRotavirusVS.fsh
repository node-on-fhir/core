ValueSet: IMMZD2DTRotavirusVS
Title: "IMMZD2DTRotavirus ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTRotavirus for IMMZ.D2.DT.Rotavirus.
Business rule: Determine if the client is due for a rotavirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: IMMZ.D2.DT.Rotavirus
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 weeks-41"]], [[Client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for rotavirus vaccination-48"]], [[Client is not due for rotavirus vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No rotavirus primary series doses were administered-118"]], [[No rotavirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and 24 months-52"]], [[Client's age is between 6 weeks and 24 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for rotavirus vaccination-44"]], [[Client is due for rotavirus vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One rotavirus primary series dose was administered-118"]], [[One rotavirus primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two rotavirus primary series doses were administered-118"]], [[Two rotavirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 months and 24 months-52"]], [[Client's age is between 6 months and 24 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The series administered to the client is a mixed series or a series with unknown vaccine products-169"]], [[The series administered to the client is a mixed series or a series with unknown vaccine products]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccines was administered in the last 4 weeks-92"]], [[Live vaccines was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in last 4 weeks-92"]], [[No live vaccine was administered in last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The series administered to the client contains the same product-169"]], [[The series administered to the client contains the same product]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The series contain more than two doses-27"]], [[The series contain more than two doses]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in last 4 weeks-92"]], [[Live vaccine was administered in last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The series contain less than or equal to two doses-27"]], [[The series contain less than or equal to two doses]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rotavirus immunization schedule is complete-49"]], [[Rotavirus immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three rotavirus primary series doses were administered-118"]], [[Three rotavirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rotavirus immunization schedule is complete-50"]], [[Rotavirus immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 24 months-27"]], [[Client's age is more than 24 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for rotavirus vaccination if immunization schedule is not complete.-109"]], [[Client is not due for rotavirus vaccination if immunization schedule is not complete.]] )