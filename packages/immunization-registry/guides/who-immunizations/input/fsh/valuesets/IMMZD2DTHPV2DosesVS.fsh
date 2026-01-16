ValueSet: IMMZD2DTHPV2DosesVS
Title: "IMMZD2DTHPV2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTHPV2Doses for IMMZ.D2.DT.HPV.2 doses.
Business rule: Determine if the client is due for a human papillomavirus (HPV) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 years-40"]], [[Client's age is less than 9 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for HPV vaccination-48"]], [[Client is not due for HPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No HPV primary series doses were administered-112"]], [[No HPV primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 9 and 14 years-51"]], [[Client's age is between 9 and 14 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's biological sex is female-16"]], [[Client's biological sex is female]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for HPV vaccination-44"]], [[Client is due for HPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age more than or equal to 15 years-41"]], [[Client's age more than or equal to 15 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note.-66"]], [[Clinical judgement is required. Create a clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's biological sex is not female-16"]], [[Client's biological sex is not female]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One HPV primary series dose was administered-112"]], [[One HPV primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest HPV dose was administered less than 6 months ago-103"]], [[The latest HPV dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest HPV dose was administered more than 6 months ago-103"]], [[The latest HPV dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two HPV primary series doses were administered-112"]], [[Two HPV primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is positive-29"]], [[Client's HIV status is positive]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is immunocompromised-26"]], [[Client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest HPV dose was administered more than 6 months ago-102"]], [[The latest HPV dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not immunocompromised-26"]], [[Client is not immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is negative or unknown-29"]], [[Client's HIV status is negative or unknown]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"HPV immunization schedule is complete-49"]], [[HPV immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three HPV primary series doses were administered-112"]], [[Three HPV primary series doses were administered]] )