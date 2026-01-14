ValueSet: IMMZD2DTCholeraWCVaccinesVS
Title: "IMMZD2DTCholeraWCVaccines ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTCholeraWCVaccines for IMMZ.D2.DT.Cholera.WC vaccines.
Business rule: Determine if the client is due for a cholera vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Whole-cell (WC) vaccines schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 1 year-39"]], [[Client's age is less than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for cholera vaccination-48"]], [[Client is not due for cholera vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 1 year-39"]], [[Client's age is more than or equal to 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No cholera primary series dose was administered-116"]], [[No cholera primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera vaccination-44"]], [[Client is due for cholera vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One cholera primary series dose was administered-116"]], [[One cholera primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered less than 14 days ago-106"]], [[The latest cholera dose was administered less than 14 days ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered more than 14 days ago-106"]], [[The latest cholera dose was administered more than 14 days ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two cholera primary series doses were administered-116"]], [[Two cholera primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No cholera booster series dose was administered-114"]], [[No cholera booster series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered less than 3 years ago-106"]], [[The latest cholera dose was administered less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is not due for cholera booster dose-142"]], [[Primary series is complete. Client is not due for cholera booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered more than 3 years ago-106"]], [[The latest cholera dose was administered more than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is due for cholera booster dose-138"]], [[Primary series is complete. Client is due for cholera booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"At least one booster series dose was administered-115"]], [[At least one booster series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dose number of the latest dose is one-68"]], [[Dose number of the latest dose is one]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for cholera booster dose-48"]], [[Client is not due for cholera booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered more than 14 days ago and less than 3 years ago-118"]], [[The latest cholera dose was administered more than 14 days ago and less than 3 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera booster dose-44"]], [[Client is due for cholera booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dose number of the latest dose is two-68"]], [[Dose number of the latest dose is two]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Booster series is complete-81"]], [[Booster series is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera vaccination-155"]], [[Client is due for cholera vaccination]] )