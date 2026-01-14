Profile:      IMMZAdverseEvent
Parent:       AdverseEvent
Id:           IMMZ.AdverseEvent
Title:        "SMART Guidelines Immunizations AdverseEvent"
Description:  "AdverseEvent Profile for the Immunizations SMART Guidelines.  From IMMZ.D17 Report AEFI"

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
* ^date = "2025-06-25"

* event 1..1
* event from IMMZ.D.DE95 (required)
* date 1..1
* seriousness 1..1
* seriousness from IMMZ.D.DE107 (required)
* outcome 1..1
* extension contains IMMZOtherMedicalEvent named otherMedicalEvent 0..1
