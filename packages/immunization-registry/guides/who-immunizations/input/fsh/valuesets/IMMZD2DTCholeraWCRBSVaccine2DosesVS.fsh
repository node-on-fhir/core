ValueSet: IMMZD2DTCholeraWCRBSVaccine2DosesVS
Title: "IMMZD2DTCholeraWCRBSVaccine2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTCholeraWCRBSVaccine2Doses for IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses.
Business rule: Determine if the client is due for a cholera vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 5 years-40"]], [[Client's age is more than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No cholera primary series dose was administered-116"]], [[No cholera primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera vaccination-44"]], [[Client is due for cholera vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"At least one cholera primary series dose was administered-117"]], [[At least one cholera primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dose number of the latest primary series dose is one-106"]], [[Dose number of the latest primary series dose is one]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered less than 1 week ago-105"]], [[The latest cholera dose was administered less than 1 week ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for cholera vaccination-48"]], [[Client is not due for cholera vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered more than 1 week and less than 6 weeks ago-115"]], [[The latest cholera dose was administered more than 1 week and less than 6 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered more than 6 weeks ago-106"]], [[The latest cholera dose was administered more than 6 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera vaccination-155"]], [[Client is due for cholera vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dose number of the latest primary series dose is more than or equal to two-107"]], [[Dose number of the latest primary series dose is more than or equal to two]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}-139"]], [[The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is due for cholera booster dose-126"]], [[Primary series is complete. Client is due for cholera booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}-139"]], [[The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for cholera vaccination-167"]], [[Client is due for cholera vaccination]] )