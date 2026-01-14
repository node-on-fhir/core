Logical:      IMMZD21
Title:        "IMMZ.D21.Generate verifiable digital certificate"
Description:  "Data elements for the IMMZ.D21.Generate verifiable digital certificate Data Dictionary Activity."

* ^name = "IMMZ_D21_Generate_verifiable_digital_certificate"
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
* certificateIssuer 1..1 string "Certificate issuer" "The authority or authorized organization that issued the vaccination certificate"
  * ^code[+] = IMMZ.D#DE151
* healthCertificateIdentifier 1..1 string "Health Certificate Identifier (HCID)" "Unique identifier used to associate the immunization event represented in a paper vaccination card to its digital representation(s)"
  * ^code[+] = IMMZ.D#DE152
* certificateValidFrom 1..1 dateTime "Certificate valid from" "Date in which the certificate for an immunization event became valid.  No health or clinical inferences should be made from this date"
  * ^code[+] = IMMZ.D#DE153
* certificateValidUntil 1..1 dateTime "Certificate valid until" "Last date in which the certificate for an immunization event is valid. No health or clinical inferences should be made from this date"
  * ^code[+] = IMMZ.D#DE154
* certificateSchemaVersion 1..1 string "Certificate schema version" "Version of the core data set and HL7 Fast Health Interoperability Resources (FHIR) implementation guide that the certificate is using"
  * ^code[+] = IMMZ.D#DE155