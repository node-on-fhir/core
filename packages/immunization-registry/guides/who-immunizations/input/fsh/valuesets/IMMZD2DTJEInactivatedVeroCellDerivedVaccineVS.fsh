ValueSet: IMMZD2DTJEInactivatedVeroCellDerivedVaccineVS
Title: "IMMZD2DTJEInactivatedVeroCellDerivedVaccine ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTJEInactivatedVeroCellDerivedVaccine for IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine.
Business rule: Determine if the client is due for a Japanese encephalitis (JE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 months-41"]], [[Client's age is less than 6 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for JE vaccination-48"]], [[Client is not due for JE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No JE primary series doses were administered-111"]], [[No JE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 6 months-41"]], [[Client's age is more than or equal to 6 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for JE vaccination-44"]], [[Client is due for JE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One JE primary series dose was administered-111"]], [[One JE primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest JE dose was administered less than 4 weeks ago-94"]], [[The latest JE dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest JE dose was administered more than 4 weeks ago-94"]], [[The latest JE dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two JE primary series doses were administered-111"]], [[Two JE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"JE immunization schedule is complete-138"]], [[JE immunization schedule is complete]] )