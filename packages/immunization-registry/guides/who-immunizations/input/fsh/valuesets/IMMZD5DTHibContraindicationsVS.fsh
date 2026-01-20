ValueSet: IMMZD5DTHibContraindicationsVS
Title: "IMMZD5DTHibContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTHibContraindications for IMMZ.D5.DT.Hib contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications (9)
Table: IMMZ.D5.DT.Hib contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of severe allergic reactions-59"]], [[The client has a history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Hib vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66"]], [[Hib vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.]] )