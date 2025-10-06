ValueSet: IMMZD2DTJELiveRecombinantVaccineVS
Title: "IMMZD2DTJELiveRecombinantVaccine ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTJELiveRecombinantVaccine for IMMZ.D2.DT.JE.Live recombinant vaccine.
Business rule: Determine if the client is due for a Japanese encephalitis (JE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 months-41"]], [[Client's age is less than 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for JE vaccination-48"]], [[Client is not due for JE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No JE primary series doses were administered-111"]], [[No JE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 9 months-41"]], [[Client's age is more than or equal to 9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the last 4 weeks-92"]], [[No live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for JE vaccination-44"]], [[Client is due for JE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the last 4 weeks-92"]], [[Live vaccine was administered in the last 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One JE primary series doses were administered-111"]], [[One JE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"JE immunization schedule is complete-138"]], [[JE immunization schedule is complete]] )