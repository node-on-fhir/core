ValueSet: IMMZD5DTJEContraindicationsVS
Title: "IMMZD5DTJEContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTJEContraindications for IMMZ.D5.DT.JE contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.JE contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is immunocomprised-51"]], [[The client is immunocomprised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )