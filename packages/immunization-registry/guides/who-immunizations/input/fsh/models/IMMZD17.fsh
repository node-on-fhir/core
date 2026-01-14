Invariant:    IMMZ-D-reqReaction-1
Description:  "Required if input in IMMZ.D.DE92 Reaction reported is Yes"
Expression:   "not(%resource.reactionReport.exists()) or %resource.reactionReported.value != true or $this.exists()"
Severity:     #error


Logical:      IMMZD17
Title:        "IMMZ.D17.Report AEFI"
Description:  "Data elements for the IMMZ.D17.Report AEFI Data Dictionary Activity."

* ^name = "IMMZ_D17_Report_AEFI"
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
* reactionReported 0..1 boolean "Reaction reported" "Indicates observation of an adverse event/reaction"
  * ^code[+] = IMMZ.D#DE92
  * ^code[+] = $ICD11#PK81.7 "Injection or infusion for therapeutic or diagnostic purposes associated with injury or harm in therapeutic use"
  * ^code[+] = $SCT#418799008 "Finding reported by subject or history provider (finding)"
* reactionDate 0..1 date "Reaction date" "When adverse event/reaction started"
  * obeys IMMZ-D-reqReaction-1 and IMMZ-D-dateOccurred-1
  * ^code[+] = IMMZ.D#DE93
  * ^code[+] = $LNC#30953-4 "Date and time of onset of vaccination adverse event"
* reactionManifestation 0..1 Coding "Reaction manifestation" "The manifestation of the reaction (e.g. infected abscess, swelling, rash, hives, diarrhoea, etc.) observed after administering the vaccine"
* reactionManifestation from IMMZ.D.DE95 (required)
  * obeys IMMZ-D-reqReaction-1
  * ^code[+] = IMMZ.D#DE95
  * ^code[+] = $ICD11#NE80.3 "Other serum reactions. This code includes 'Complications of vaccination, serum reaction'. A more specific code may be selected based on the documented reaction/manifestation"
* typeOfReaction 0..1 Coding "Type of reaction" "If the event resulted in a reaction, what is the type of reaction"
* typeOfReaction from IMMZ.D.DE107 (required)
  * obeys IMMZ-D-reqReaction-1
  * ^code[+] = IMMZ.D#DE107
* otherImportantMedicalEvent 0..1 string "Other important medical event (specify)" "There was another important reaction or medical event "
  * ^code[+] = IMMZ.D#DE113
* reactionOutcome 0..1 Coding "Reaction outcome" "The outcome of the reaction (e.g. death, recovered, recovering)"
* reactionOutcome from IMMZ.D.DE115 (required)
  * obeys IMMZ-D-reqReaction-1
  * ^code[+] = IMMZ.D#DE115
  * ^code[+] = $SCT#293104008 "Adverse reaction to component of vaccine product (disorder)"

Mapping:    IMMZD17.to.Observation
Source:     IMMZD17
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZAdverseEvent"
Title:      "Mapping from the IMMZ.D17 to the IMMZAdverseEvent profile"

* -> "AdverseEvent"
* patient -> "AdverseEvent.subject"
* reactionDate -> "AdverseEvent.date"
* reactionManifestation -> "AdverseEvent.event"
* typeOfReaction -> "AdverseEvent.seriousness"
* otherImportantMedicalEvent -> "AdverseEvent.extension[otherMedicalEvent].valueString"
* reactionOutcome -> "AdverseEvent.outcome"