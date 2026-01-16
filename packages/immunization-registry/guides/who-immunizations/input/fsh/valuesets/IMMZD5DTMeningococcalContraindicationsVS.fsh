ValueSet: IMMZD5DTMeningococcalContraindicationsVS
Title: "IMMZD5DTMeningococcalContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTMeningococcalContraindications for IMMZ.D5.DT.Meningococcal contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Meningococcal contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-130"]], [[Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )