ValueSet: IMMZD5DTBCGContraindicationsVS
Title: "IMMZD5DTBCGContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTBCGContraindications for IMMZ.D5.DT.BCG contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.BCG contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is pregnant-52"]], [[The client is pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Bacille Calmette–Guérin (BCG) vaccination is contraindicated-57"]], [[Bacille Calmette–Guérin (BCG) vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-60"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-67"]], [[BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immunodeficiency syndromes-60"]], [[The client has immunodeficiency syndromes]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"BCG vaccination is contraindicated-57"]], [[BCG vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is exposed to immunosuppressive treatment-72"]], [[The client is exposed to immunosuppressive treatment]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 1 year-14"]], [[Client's age is less than 1 year]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 1 year-14"]], [[Client's age is more than or equal to 1 year]] )