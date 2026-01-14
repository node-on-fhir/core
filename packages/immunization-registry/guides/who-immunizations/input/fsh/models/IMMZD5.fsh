Logical:      IMMZD5
Title:        "IMMZ.D5.Determine vaccine(s) to be administered based on contraindications"
Description:  "Data elements for the IMMZ.D5.Determine vaccine(s) to be administered based on contraindications Data Dictionary Activity."

* ^name = "IMMZ_D5_Determine_vaccine_s__to_be_administered_based_on_contraindications"
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
* potentialContraindications 1..* Coding "Potential contraindications" "Specific situations or medical conditions for which it is advised or recommended to avoid or delay administering a particular vaccine"
* potentialContraindications from IMMZ.D.DE161 (required)
  * ^code[+] = IMMZ.D#DE161

Mapping:    IMMZD5.to.Observation
Source:     IMMZD5
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZObservation"
Title:      "Mapping from the IMMZ.D5 to the IMMZObservation profile"

* -> "Observation"
* patient -> "Observation.subject"
* potentialContraindications -> "Observation.valueCodeableConcept"