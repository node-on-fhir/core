Logical:      IMMZD7
Title:        "IMMZ.D7.Counsel client"
Description:  "Data elements for the IMMZ.D7.Counsel client Data Dictionary Activity."

* ^name = "IMMZ_D7_Counsel_client"
* ^status = #active
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
* ^date = "2025-01-13"

* patient 1..1 Reference "Patient" "The patient."
* clientEducationAndCounsellingOnImmunization 0..1 Coding "Client education and counselling on immunization" "Providing information, guidance and support to client or caretakers (such as parents or legal guardians) regarding immunization practices"
* clientEducationAndCounsellingOnImmunization from IMMZ.D.DE86 (required)
  * ^code[+] = IMMZ.D#DE86
  * ^code[+] = $ICD11#QA1Y "Contact with health services for other specified counselling"