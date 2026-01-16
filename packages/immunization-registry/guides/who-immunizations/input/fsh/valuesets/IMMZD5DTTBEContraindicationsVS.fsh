ValueSet: IMMZD5DTTBEContraindicationsVS
Title: "IMMZD5DTTBEContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTTBEContraindications for IMMZ.D5.DT.TBE contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.TBE contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has moderate to severe fever-58"]], [[The client has moderate to severe fever]] )