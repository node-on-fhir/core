ValueSet: IMMZD5DTPneumococcalContraindicationsVS
Title: "IMMZD5DTPneumococcalContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTPneumococcalContraindications for IMMZ.D5.DT.Pneumococcal contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Pneumococcal contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of anaphylactic reactions-67"]], [[The client has a history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of severe allergic reactions-59"]], [[The client has a history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66"]], [[Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.]] )