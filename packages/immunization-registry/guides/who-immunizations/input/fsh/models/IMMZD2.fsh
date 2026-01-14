Logical:      IMMZD2
Title:        "IMMZ.D2.Determine required vaccination(s)"
Description:  "Data elements for the IMMZ.D2.Determine required vaccination(s) Data Dictionary Activity."

* ^name = "IMMZ_D2_Determine_required_vaccination_s_"
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
* immunizationRecommendationStatus 1..1 Coding "Immunization recommendation status" "The current status or recommendation for a specific immunization for an client"
* immunizationRecommendationStatus from IMMZ.D.DE156 (required)
  * ^code[+] = IMMZ.D#DE156