ValueSet: IMMZD5DTHPVContraindicationsVS
Title: "IMMZD5DTHPVContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTHPVContraindications for IMMZ.D5.DT.HPV contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.HPV contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Human papillomavirus (HPV) vaccination is contraindicated-56"]], [[Human papillomavirus (HPV) vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )