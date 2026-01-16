ValueSet: IMMZD5DTRabiesContraindicationsVS
Title: "IMMZD5DTRabiesContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTRabiesContraindications for IMMZ.D5.DT.Rabies contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Rabies contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )