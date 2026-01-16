ValueSet: IMMZD2DTPolioSequentialIPVbOPVVS
Title: "IMMZD2DTPolioSequentialIPVbOPV ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTPolioSequentialIPVbOPV for IMMZ.D2.DT.Polio.Sequential IPV–bOPV.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Sequential "Bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV)" schedule (in countries with high vaccination coverage [e.g. 90–95%] and low importation risk [where neighbouring countries and/or countries that share substantial population movement have a similarly high coverage])
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No poliovirus primary series doses were administered-130"]], [[No poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 8 weeks-40"]], [[Client's age is less than 8 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for IPV vaccination-48"]], [[Client is not due for IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 8 weeks-40"]], [[Client's age is more than or equal to 8 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for IPV vaccination-86"]], [[Client is due for IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One poliovirus primary series dose was administered-130"]], [[One poliovirus primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered less than 4 weeks ago-120"]], [[The latest poliovirus dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered more than 4 weeks ago-120"]], [[The latest poliovirus dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two poliovirus primary series doses were administered-130"]], [[Two poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for bOPV vaccination-87"]], [[Client is due for bOPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three poliovirus primary series doses were administered-130"]], [[Three poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for bOPV vaccination-48"]], [[Client is not due for bOPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Four poliovirus primary series doses were administered-130"]], [[Four poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete-174"]], [[Primary series is complete]] )