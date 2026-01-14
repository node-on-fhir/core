RuleSet: MedicationRequestActivityDefinition( antigen, version, date, doNotPerform, product )
* extension[+]
  * url = "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-knowledgeCapability"
  * valueCode = #computable
* version = "{version}"
* name = "IMMZ{antigen}MedicationRequest"
* status = #draft
* experimental = false
* date = {date}
* publisher = "World Health Organization (WHO)"
* contact[+]
  * telecom[+]
    * system = #url
    * value = "https://who.int"
* kind = #MedicationRequest
* intent = #proposal
* doNotPerform = {doNotPerform}
* productCodeableConcept = {product}
