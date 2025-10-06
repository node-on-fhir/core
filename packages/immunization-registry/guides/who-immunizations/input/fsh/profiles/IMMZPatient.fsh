Profile:      IMMZPatient
Parent:       Patient
Id:           IMMZ.Patient
Title:        "SMART Guidelines Immunizations Patient"
Description:  "Patient Profile for the Immunizations SMART Guidelines.  From IMMZ.C Client Registration for IMMZ.C4.Create client record OR IMMZ.C5.3.Update client details."

* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareablestructuredefinition"
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishablestructuredefinition"
* ^version = "0.2.0"
* ^experimental = false
* ^publisher = "WHO"
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/cqf-knowledgeCapability"
* ^extension[=].valueCode = #shareable
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm"
* ^extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionPolicy"
* ^extension[=].valueCodeableConcept = http://terminology.hl7.org/CodeSystem/artifact-version-policy-codes#metadata
* ^date = "2024-12-18"

* identifier 1..*
* identifier.value 1..1

* name ^slicing.discriminator.type = #exists
* name ^slicing.discriminator.path = "text"
* name ^slicing.rules = #open
* name contains immzName 1..* 

* name[immzName].text 1..1
* name[immzName].family MS 
* name[immzName].given MS

* gender 1..1
* birthDate 1..1
* address 1..1

* telecom ^slicing.discriminator.type = #value
* telecom ^slicing.discriminator.path = "system"
* telecom ^slicing.rules = #open
* telecom contains immzPhone 1..*

* telecom[immzPhone].system 1..1
* telecom[immzPhone].system = #phone
* telecom[immzPhone].value 1..1