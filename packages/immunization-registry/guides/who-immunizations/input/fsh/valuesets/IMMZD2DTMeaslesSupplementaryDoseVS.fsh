ValueSet: IMMZD2DTMeaslesSupplementaryDoseVS
Title: "IMMZD2DTMeaslesSupplementaryDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTMeaslesSupplementaryDose for IMMZ.D2.DT.Measles.Supplementary dose.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D2.DT.Measles.Supplementary dose
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles supplementary dose was not administered-131"]], [[Measles supplementary dose was not administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles routine immunization schedule is complete-104"]], [[Measles routine immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Live vaccine was administered in the past 4 weeks-92"]], [[Live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for measles supplementary dose-48"]], [[Client is not due for measles supplementary dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No live vaccine was administered in the past 4 weeks-92"]], [[No live vaccine was administered in the past 4 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Consider measles supplementary dose. Create a clinical note-66"]], [[Consider measles supplementary dose. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles supplementary dose was administered-131"]], [[Measles supplementary dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles immunization schedule is complete-49"]], [[Measles immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Decision ID-0"]], [[Decision ID]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"IMMZ.D5.DT.Measles contraindications-0"]], [[IMMZ.D5.DT.Measles contraindications]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is pregnant-52"]], [[The client is pregnant]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles vaccination contraindicated-56"]], [[Measles vaccination contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of anaphylactic reactions-67"]], [[The client has history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note-66"]], [[Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of severe allergic reactions-59"]], [[The client has history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement required. Create a clinical note-66"]], [[Clinical judgement required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client is severely immunosuppressed-59"]], [[The client is severely immunosuppressed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a symptomatic HIV infection-59"]], [[The client has a symptomatic HIV infection]] )