ValueSet: IMMZD5DTMumpsContraindicationsVS
Title: "IMMZD5DTMumpsContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTMumpsContraindications for IMMZ.D5.DT.Mumps contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Mumps contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Mumps vaccination is contraindicated-56"]], [[Mumps vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has allergy to vaccine components-60"]], [[The client has allergy to vaccine components]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Mumps vaccination could be contraindicated. Clinical judgement is required.-88"]], [[Mumps vaccination could be contraindicated. Clinical judgement is required.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has immune deficiency-60"]], [[The client has immune deficiency]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunosuppressed-59"]], [[The client is severely immunosuppressed]] )