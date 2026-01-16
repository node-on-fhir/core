ValueSet: IMMZD2DTPolioBOPVPlusIPVVS
Title: "IMMZD2DTPolioBOPVPlusIPV ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTPolioBOPVPlusIPV for IMMZ.D2.DT.Polio.bOPV plus IPV.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 weeks-40"]], [[Client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for bOPV vaccination-48"]], [[Client is not due for bOPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No poliovirus primary series doses were administered-130"]], [[No poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and 3 months-51"]], [[Client's age is between 6 weeks and 3 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for bOPV vaccination-87"]], [[Client is due for bOPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 3 months-41"]], [[Client's age is more than 3 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for bOPV and IPV vaccination-133"]], [[Client is due for bOPV and IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One poliovirus primary series dose was administered-130"]], [[One poliovirus primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and 14 weeks-51"]], [[Client's age is between 6 weeks and 14 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest bOPV dose was administered less than 4 weeks ago-159"]], [[The latest bOPV dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for polio vaccination-48"]], [[Client is not due for polio vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest bOPV dose was administered more than 4 weeks ago-159"]], [[The latest bOPV dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The poliovirus dose administered is bOPV-115"]], [[The poliovirus dose administered is bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 14 weeks-41"]], [[Client's age is more than or equal to 14 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for IPV vaccination-86"]], [[Client is due for IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The poliovirus dose administered is IPV-115"]], [[The poliovirus dose administered is IPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest IPV dose was administered less than 4 months ago-159"]], [[The latest IPV dose was administered less than 4 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest IPV dose was administered more than 4 months ago-159"]], [[The latest IPV dose was administered more than 4 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two poliovirus primary series doses were administered-130"]], [[Two poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The two doses administered are bOPV-115"]], [[The two doses administered are bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"From the two doses administered one is bOPV and one is IPV-115"]], [[From the two doses administered one is bOPV and one is IPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The two doses administered are IPV-115"]], [[The two doses administered are IPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three poliovirus primary series doses were administered-130"]], [[Three poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The three doses administered are bOPV-115"]], [[The three doses administered are bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 14 weeks-41"]], [[Client's age is less than 14 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"From the three doses administered, one is IPV and two are bOPV-115"]], [[From the three doses administered, one is IPV and two are bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"From the three doses administered, one is bOPV and two are IPV-115"]], [[From the three doses administered, one is bOPV and two are IPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Four poliovirus primary series doses were administered-130"]], [[Four poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"From the four doses administered, one is IPV and three are bOPV-115"]], [[From the four doses administered, one is IPV and three are bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"From the four doses administered, two are IPV and two are bOPV-115"]], [[From the four doses administered, two are IPV and two are bOPV]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Five poliovirus primary series doses were administered-130"]], [[Five poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Polio immunization schedule is complete-157"]], [[Polio immunization schedule is complete]] )