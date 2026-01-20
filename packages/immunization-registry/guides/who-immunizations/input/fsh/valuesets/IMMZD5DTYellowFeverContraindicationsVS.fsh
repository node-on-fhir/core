ValueSet: IMMZD5DTYellowFeverContraindicationsVS
Title: "IMMZD5DTYellowFeverContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTYellowFeverContraindications for IMMZ.D5.DT.Yellow fever contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Yellow fever contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 months-41"]], [[Client's age is less than 6 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Yellow fever vaccination is contraindicated-56"]], [[Yellow fever vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is 6–9 months-52"]], [[Client's age is 6–9 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 60 years-41"]], [[Client's age is more than or equal to 60 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of severe allergic reactions-59"]], [[The client has a history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunocompromised-60"]], [[The client is severely immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is lactating-47"]], [[The client is lactating]] )