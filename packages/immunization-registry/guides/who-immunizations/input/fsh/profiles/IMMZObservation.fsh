Profile:      IMMZObservation
Parent:       Observation
Id:           IMMZ.Observation
Title:        "SMART Guidelines Immunizations Observation"
Description:  "Observation Profile for the Immunizations SMART Guidelines.  From IMMZ.D Administer Vaccine"

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
* ^date = "2025-01-16"


* code from IMMZ.D.Observation (required)

* partOf ^slicing.discriminator[+].type = #type
* partOf ^slicing.discriminator[=].path = "$this"
* partOf ^slicing.rules = #open
* partOf contains immzPartOf 0..*

* partOf[immzPartOf] only Reference(IMMZImmunization)

* value[x] only boolean or Quantity or CodeableConcept or integer or dateTime
