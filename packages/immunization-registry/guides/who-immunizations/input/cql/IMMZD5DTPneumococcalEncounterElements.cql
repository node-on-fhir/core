
/*
  * Library: IMMZD5DTPneumococcalEncounterElements
  */
library IMMZD5DTPneumococcalEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTPneumococcalElements called PneumococcalElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@input: The client has a history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential Contraindications
*/
define "The client has a history of anaphylactic reactions":
  Encounter."The client has history of anaphylactic reactions"

/*
@input: The client has a history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential Contraindications
*/
define "The client has a history of severe allergic reactions":
  Encounter."The client has history of severe allergic reactions"

