
RuleSet: PlanDefMain( library, version )
* meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareableplandefinition"
* meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishableplandefinition"
* library = Canonical({library}Logic)
* extension[+]
  * url = "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-knowledgeCapability"
  * valueCode = #computable
* version = "{version}"
* name = "{library}"
* status = #draft
* experimental = false
* publisher = "World Health Organization (WHO)"
* relatedArtifact[+]
  * type = #citation
  * citation = "WHO recommendations for routine immunization - summary tables (January 2025)"


RuleSet: PlanDefMedicationRequestAction( title, description, rationale, condition, action )
* action[+]
  * extension[+]
    * url = "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-rationale"
    * valueMarkdown = {rationale}
  * title = "{title}"
  * description = {description}
  * condition[+]
    * kind = #applicability
    * expression
      * description = "{condition}"
      * language = #text/cql-identifier
      * expression = "{condition}"
  * definitionCanonical = Canonical({action})
  * dynamicValue[+]
    * path = "status"
    * expression
      * language = #text/cql-expression
      * expression = "'draft'"
  * dynamicValue[+]
    * path = "intent"
    * expression
      * language = #text/cql-expression
      * expression = "'proposal'"

RuleSet: PlanDefMedicationRequestUpdate( title, description, condition, action, mrid )
* action[+]
  * title = "{title}"
  * description = {description}
  * type = $action-type#update
  * condition[+]
    * kind = #applicability
    * expression
      * description = "{condition}"
      * language = #text/cql-identifier
      * expression = "{condition}"
  * definitionCanonical = Canonical({action})
  * dynamicValue[+]
    * path = "id"
    * expression
      * description = "{mrid}"
      * language = #text/cql-identifier
      * expression = "{mrid}"


RuleSet: PlanDefCommunicationRequestAction( title, description, condition, text )
* action[+]
  * title = "{title}"
  * description = {description}
  * condition[+]
    * kind = #applicability
    * expression
      * description = "{condition}"
      * language = #text/cql-identifier
      * expression = "{condition}"
  * definitionCanonical = Canonical(IMMZD2DTCR)
  * dynamicValue[+]
    * path = "status"
    * expression
      * language = #text/cql-expression
      * expression = "'active'"
  * dynamicValue[+]
    * path = "payload.contentString"
    * expression
      * language = #text/cql-identifier
      * expression = "{text}"
/*
  * dynamicValue[+]
    * path = "payload.contentAttachment.language"
    * expression
      * language = #text/cql-expression
      * expression = "'en-US'"
  * dynamicValue[+]
    * path = "payload.contentAttachment.contentType"
    * expression
      * language = #text/cql-expression
      * expression = "'text/plain'"
*/
  * dynamicValue[+]
    * path = "category.coding"
    * expression
      * description = "Category of communication"
      * language = #text/cql-expression
      * expression = "Code { system: 'http://terminology.hl7.org/CodeSystem/communication-category', code: 'alert' }"
  * dynamicValue[+]
    * path = "priority"
    * expression
      * description = "Alert priority"
      * language = #text/cql-expression
      * expression = "Code { system: 'http://hl7.org/fhir/request-priority', code: 'routine' }"