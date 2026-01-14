ValueSet: IMMZD5DTMeaslesContraindicationsVS
Title: "IMMZD5DTMeaslesContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTMeaslesContraindications for IMMZ.D5.DT.Measles contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Measles contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is pregnant-52"]], [[The client is pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles vaccination contraindicated-56"]], [[Measles vaccination contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of anaphylactic reactions-67"]], [[The client has history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note-66"]], [[Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement required. Create a clinical note-66"]], [[Clinical judgement required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunosuppressed-59"]], [[The client is severely immunosuppressed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a symptomatic HIV infection-59"]], [[The client has a symptomatic HIV infection]] )