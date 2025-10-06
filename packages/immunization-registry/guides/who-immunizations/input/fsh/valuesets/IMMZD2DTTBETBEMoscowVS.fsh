ValueSet: IMMZD2DTTBETBEMoscowVS
Title: "IMMZD2DTTBETBEMoscow ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTTBETBEMoscow for IMMZ.D2.DT.TBE.TBE-Moscow.
Business rule: Determine if the client is due for a tick-borne encephalitis (TBE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: TBE-Moscow schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children	)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 3 years-40"]], [[Client's age is less than 3 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for TBE vaccination-48"]], [[Client is not due for TBE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No TBE primary series doses were administered-112"]], [[No TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 3 years-40"]], [[Client's age is more than or equal to 3 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for TBE vaccination-44"]], [[Client is due for TBE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One TBE primary series dose was administered-112"]], [[One TBE primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 1 month ago-95"]], [[The latest TBE dose was administered less than 1 month ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 1 month ago-95"]], [[The latest TBE dose was administered more than 1 month ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two TBE primary series doses were administered-112"]], [[Two TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 12 months ago-104"]], [[The latest TBE dose was administered less than 12 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 12 months ago-97"]], [[The latest TBE dose was administered more than 12 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three TBE primary series doses were administered-112"]], [[Three TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 3 years ago-102"]], [[The latest TBE dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is not due for TBE booster dose-138"]], [[Primary series is complete. Client is not due for TBE booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 3 years ago-95"]], [[The latest TBE dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is due for TBE booster dose-134"]], [[Primary series is complete. Client is due for TBE booster dose]] )