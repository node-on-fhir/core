ValueSet: IMMZD5DTVaricellaContraindicationsVS
Title: "IMMZD5DTVaricellaContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTVaricellaContraindications for IMMZ.D5.DT.Varicella contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Varicella contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Varicella vaccination is contraindicated-56"]], [[Varicella vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is planning to get pregnant in the next month-76"]], [[The client is planning to get pregnant in the next month]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create clinical note-66"]], [[Clinical judgement is required. Create clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immune deficiency-60"]], [[The client has immune deficiency]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note-66"]], [[Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is immunocompromised-51"]], [[The client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create clinical note-67"]], [[Clinical judgement is required. Create clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is receiving or has received medications that may be immunosuppressive-72"]], [[The client is receiving or has received medications that may be immunosuppressive]] )