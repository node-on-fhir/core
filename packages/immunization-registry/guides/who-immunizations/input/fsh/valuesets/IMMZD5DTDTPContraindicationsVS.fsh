ValueSet: IMMZD5DTDTPContraindicationsVS
Title: "IMMZD5DTDTPContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTDTPContraindications for IMMZ.D5.DT.DTP contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.DTP contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of anaphylactic reactions-67"]], [[The client has a history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-250"]], [[Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client currently has a severe acute illness-54"]], [[The client currently has a severe acute illness]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Tetanus vaccination is contraindicated-112"]], [[Tetanus vaccination is contraindicated]] )