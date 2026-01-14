ValueSet: IMMZD5DTPolioContraindicationsVS
Title: "IMMZD5DTPolioContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTPolioContraindications for IMMZ.D5.DT.Polio contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Polio contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Poliovirus vaccination could be contraindicated. Clinical judgement required-66"]], [[Poliovirus vaccination could be contraindicated. Clinical judgement required]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunocompromised-60"]], [[The client is severely immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Poliovirus vaccination with bOPV is contraindicated-281"]], [[Poliovirus vaccination with bOPV is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immunodeficiency syndromes-60"]], [[The client has immunodeficiency syndromes]] )