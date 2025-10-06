Profile:      IMMZCaregiver
Parent:       RelatedPerson
Id:           IMMZ.Caregiver
Title:        "SMART Guidelines Immunizations Caregiver (RelatedPerson)"
Description:  "Caregiver (RelatedPerson) Profile for the Immunizations SMART Guidelines.  From IMMZ.C Client Registration for IMMZ.C4.Create client record OR IMMZ.C5.3.Update client details."

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

* relationship 1..1
* relationship = http://terminology.hl7.org/5.1.0/CodeSystem-v3-RoleClass.html#CAREGIVER

* patient only Reference(IMMZPatient)

* name 1..*
* name.text 1..1
* name.family MS 
* name.given MS