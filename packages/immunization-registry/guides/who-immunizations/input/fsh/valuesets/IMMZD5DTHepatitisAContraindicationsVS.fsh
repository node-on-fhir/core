ValueSet: IMMZD5DTHepatitisAContraindicationsVS
Title: "IMMZD5DTHepatitisAContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTHepatitisAContraindications for IMMZ.D5.DT.Hepatitis A contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Hepatitis A contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live attentuated Hepatitis A-containing vaccine is contraindicated-131"]], [[Live attentuated Hepatitis A-containing vaccine is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunocompromised-60"]], [[The client is severely immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of severe allergic reactions-60"]], [[The client has a history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )