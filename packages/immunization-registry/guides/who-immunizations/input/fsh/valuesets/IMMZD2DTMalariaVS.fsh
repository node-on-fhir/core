ValueSet: IMMZD2DTMalariaVS
Title: "IMMZD2DTMalaria ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMalaria for IMMZ.D2.DT.Malaria.
Business rule: Determine if the client is due for a malaria vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 4-dose schedule (The RTS,S/AS01 malaria vaccine should be used for the prevention of Plasmodium falciparum malaria in children living in regions with moderate to high malaria transmission, as defined by WHO)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 5 months-41"]], [[Client's age is less than 5 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for malaria vaccination-48"]], [[Client is not due for malaria vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No malaria primary series doses were administered-116"]], [[No malaria primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 5 months-41"]], [[Client's age is more than or equal to 5 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for malaria vaccination-44"]], [[Client is due for malaria vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One malaria primary series dose was administered-116"]], [[One malaria primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest malaria dose was administered less than 4 weeks ago-99"]], [[The latest malaria dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest malaria dose was administered more than 4 weeks ago-106"]], [[The latest malaria dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two malaria primary series doses were administered-116"]], [[Two malaria primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three malaria primary series doses were administered-116"]], [[Three malaria primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Four malaria primary series doses were administered-116"]], [[Four malaria primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Malaria immunization schedule is complete-144"]], [[Malaria immunization schedule is complete]] )