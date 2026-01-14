
/*
  * Library: IMMZD5DTRabiesEncounterElements
  */
library IMMZD5DTRabiesEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTRabiesElements called RabiesElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Rabies dose
*/
define "Draft Medication Request for Rabies dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Rabies vaccines"


/*
@input: The client has history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has history of severe allergic reactions":
  Encounter."The client has history of severe allergic reactions"

