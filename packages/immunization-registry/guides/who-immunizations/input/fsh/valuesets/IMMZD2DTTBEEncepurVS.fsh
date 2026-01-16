ValueSet: IMMZD2DTTBEEncepurVS
Title: "IMMZD2DTTBEEncepur ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTTBEEncepur for IMMZ.D2.DT.TBE.Encepur.
Business rule: Determine if the client is due for a tick-borne encephalitis (TBE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Encepur schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children		)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 1 year-39"]], [[Client's age is less than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for TBE vaccination-48"]], [[Client is not due for TBE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No TBE primary series doses were administered-112"]], [[No TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 1 year-39"]], [[Client's age is more than or equal to 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for TBE vaccination-44"]], [[Client is due for TBE vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One TBE primary series dose was administered-112"]], [[One TBE primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 1 month ago-95"]], [[The latest TBE dose was administered less than 1 month ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 1 month ago-95"]], [[The latest TBE dose was administered more than 1 month ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two TBE primary series doses were administered-112"]], [[Two TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 9 months ago-103"]], [[The latest TBE dose was administered less than 9 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 9 months ago-103"]], [[The latest TBE dose was administered more than 9 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three TBE primary series doses were administered-112"]], [[Three TBE primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No TBE booster dose was administered-110"]], [[No TBE booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered less than 3 years ago-102"]], [[The latest TBE dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series is complete. Client is not due for TBE booster dose-138"]], [[The primary series is complete. Client is not due for TBE booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest TBE dose was administered more than 3 years ago-102"]], [[The latest TBE dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series is complete-169"]], [[The primary series is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"At least one booster dose was administered-110"]], [[At least one booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )