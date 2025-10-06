ValueSet: IMMZD5DTTyphoidContraindicationsVS
Title: "IMMZD5DTTyphoidContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTTyphoidContraindications for IMMZ.D5.DT.Typhoid contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Typhoid contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has hypersensitivity to any component of the vaccine-72"]], [[The client has hypersensitivity to any component of the vaccine]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66"]], [[Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently pregnant-52"]], [[The client is currently pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note-224"]], [[Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is currently taking antibiotics-52"]], [[The client is currently taking antibiotics]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Typhoid vaccination is contraindicated for Ty21a vaccine.-97"]], [[Typhoid vaccination is contraindicated for Ty21a vaccine.]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's HIV status is positive-29"]], [[The client's HIV status is positive]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is not immunologically stable-31"]], [[The client is not immunologically stable]] )