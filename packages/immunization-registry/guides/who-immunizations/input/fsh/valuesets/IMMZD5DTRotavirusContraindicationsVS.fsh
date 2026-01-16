ValueSet: IMMZD5DTRotavirusContraindicationsVS
Title: "IMMZD5DTRotavirusContraindications ValueSet for Decision Table"
Description: """
ValueSet IMMZD5DTRotavirusContraindications for IMMZ.D5.DT.Rotavirus contraindications.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: IMMZ.D5.DT.Rotavirus contraindications
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has prior history of intussusception-66"]], [[The client has prior history of intussusception]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rotavirus vaccination is contraindicated-56"]], [[Rotavirus vaccination is contraindicated]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has severe immunodeficiency-61"]], [[The client has severe immunodeficiency]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has a history of severe allergic reactions-59"]], [[The client has a history of severe allergic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66"]], [[Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has history of anaphylactic reactions-67"]], [[The client has history of anaphylactic reactions]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has altered immunocompetence-58"]], [[The client has altered immunocompetence]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has spina bifida-46"]], [[The client has spina bifida]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has bladder exstrophy-51"]], [[The client has bladder exstrophy]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has chronic gastrointestinal disease-66"]], [[The client has chronic gastrointestinal disease]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has acute gastroenteritis-55"]], [[The client has acute gastroenteritis]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client has moderate to severe fever-58"]], [[The client has moderate to severe fever]] )