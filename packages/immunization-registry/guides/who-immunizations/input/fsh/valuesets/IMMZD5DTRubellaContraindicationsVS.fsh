ValueSet: IMMZD5DTRubellaContraindicationsVS
Title: "IMMZD5DTRubellaContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTRubellaContraindications for IMMZ.D5.DT.Rubella contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Rubella contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rubella vaccination is contraindicated-56"]], [[Rubella vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is planning to get pregnant in next month-76"]], [[The client is planning to get pregnant in next month]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is receiving blood products-58"]], [[The client is receiving blood products]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has symptomatic HIV infection-59"]], [[The client has symptomatic HIV infection]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has TB disease-44"]], [[The client has TB disease]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immunodeficiency syndromes-60"]], [[The client has immunodeficiency syndromes]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is exposed to immunosuppressive treatment-72"]], [[The client is exposed to immunosuppressive treatment]] )