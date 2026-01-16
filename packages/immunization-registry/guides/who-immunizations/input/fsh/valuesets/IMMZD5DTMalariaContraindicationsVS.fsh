ValueSet: IMMZD5DTMalariaContraindicationsVS
Title: "IMMZD5DTMalariaContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTMalariaContraindications for IMMZ.D5.DT.Malaria contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Malaria contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has hypersensitivity to any of the vaccine components-72"]], [[The client has hypersensitivity to any of the vaccine components]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )