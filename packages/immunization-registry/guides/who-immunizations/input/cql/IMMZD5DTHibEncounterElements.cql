
/*
  * Library: IMMZD5DTHibEncounterElements
  */
library IMMZD5DTHibEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTHibElements called HibElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@input: The client has a history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has a history of severe allergic reactions":
  Encounter."The client has history of severe allergic reactions"

