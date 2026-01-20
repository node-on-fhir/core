
/*
  * Library: IMMZD5DTSeasonalinfluenzaEncounterElements
  */
library IMMZD5DTSeasonalinfluenzaEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTSeasonalinfluenzaElements called SeasonalinfluenzaElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Seasonal influenza dose
*/
define "Draft Medication Request for Seasonal influenza dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Seasonal influenza vaccines"


/*
@input: The client has a history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential contraindications
*/
define "The client has a history of anaphylactic reactions":
  Encounter."The client has history of anaphylactic reactions"

/*
@input: The client has a history of severe allergic reactions after a previous dose or to a vaccine component
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has a history of severe allergic reactions after a previous dose or to a vaccine component":
  Encounter."The client has history of severe allergic reactions"

