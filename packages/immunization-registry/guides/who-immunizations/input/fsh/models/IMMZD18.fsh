Logical:      IMMZD18
Title:        "IMMZ.D18.Determine time for next visit"
Description:  "Data elements for the IMMZ.D18.Determine time for next visit Data Dictionary Activity."

* ^name = "IMMZ_D18_Determine_time_for_next_visit"
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
* dateTimeOfFollowUpAppointment 0..1 dateTime "Date/time of follow-up appointment" "Date the client is to return for next vaccination"
  * ^code[+] = IMMZ.D#DE185
  * ^code[+] = $SCT#185353001 "Appointment date (finding)"
* recommendedFollowUpDate	 0..1 date "Recommended follow-up date" "Date when follow-up is recommended based on vaccination schedule"
  * ^code[+] = IMMZ.D#DE186
  * ^code[+] = $LNC#39289-4 "Code LongName: Follow-up (referred to) provider/specialist, appointment date CPHS"
  * ^code[+] = $SCT#410671006 "Date (attribute)"
