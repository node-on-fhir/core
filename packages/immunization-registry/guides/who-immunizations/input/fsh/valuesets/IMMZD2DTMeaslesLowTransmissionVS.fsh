ValueSet: IMMZD2DTMeaslesLowTransmissionVS
Title: "IMMZD2DTMeaslesLowTransmission ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeaslesLowTransmission for IMMZ.D2.DT.Measles.Low transmission.
Business rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Countries with low levels of measles transmission (countries that provide first dose of measles-containing vaccine (MCV) at 12 months and second dose of MCV at 15 months)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 12 months-42"]], [[Client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for MCV1-48"]], [[Client is not due for MCV1]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No measles primary series doses were administered-127"]], [[No measles primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 12 months-42"]], [[Client's age is more than or equal to 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for MCV1-44"]], [[Client is due for MCV1]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV1 was administered-127"]], [[MCV1 was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 15 months-42"]], [[Client's age is less than 15 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for MCV2-48"]], [[Client is not due for MCV2]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 15 months-42"]], [[Client's age is more than or equal to 15 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for MCV2-44"]], [[Client is due for MCV2]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV2 was administered-127"]], [[MCV2 was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles primary series is complete-104"]], [[Measles primary series is complete]] )