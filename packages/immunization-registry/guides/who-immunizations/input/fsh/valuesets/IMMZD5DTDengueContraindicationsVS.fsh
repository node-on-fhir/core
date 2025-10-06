ValueSet: IMMZD5DTDengueContraindicationsVS
Title: "IMMZD5DTDengueContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTDengueContraindications for IMMZ.D5.DT.Dengue contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Dengue contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is immunocompromised-51"]], [[The client is immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dengue vaccination is contraindicated-56"]], [[Dengue vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunocompromised-60"]], [[The client is severely immunocompromised]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently lactating-48"]], [[The client is currently lactating]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66"]], [[Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of anaphylactic reactions-66"]], [[The client has history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immunodeficiency syndromes-60"]], [[The client has immunodeficiency syndromes]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunosuppressed-59"]], [[The client is severely immunosuppressed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has symptomatic HIV infection-59"]], [[The client has symptomatic HIV infection]] )