ValueSet: IMMZD2DTMeaslesMCVDose0VS
Title: "IMMZD2DTMeaslesMCVDose0 ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeaslesMCVDose0 for IMMZ.D2.DT.Measles.MCV dose 0.
Business rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Measles-containing vaccine dose 0 (MCV0) administration
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 months-41"]], [[Client's age is less than 6 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for MCV0-48"]], [[Client is not due for MCV0]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV0 was not administered-119"]], [[MCV0 was not administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 months and 9 months-52"]], [[Client's age is between 6 months and 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Consider MCV0.-90"]], [[Consider MCV0.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 months-41"]], [[Client's age is more than or equal to 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV0 was administered-119"]], [[MCV0 was administered]] )