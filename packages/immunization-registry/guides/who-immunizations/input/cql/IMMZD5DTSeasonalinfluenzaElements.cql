
/*
  * Library: IMMZD5DTSeasonalinfluenzaElements
  */
library IMMZD5DTSeasonalinfluenzaElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

context Patient

/*
@internal: Draft Medication Request for Seasonal influenza dose
*/
define "Draft Medication Request for Seasonal influenza dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Seasonal influenza vaccines"


/*
@input: The client has a history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential contraindications
*/
define "The client has a history of anaphylactic reactions":
  Elements."The client has history of anaphylactic reactions"

/*
@input: The client has a history of severe allergic reactions after a previous dose or to a vaccine component
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has a history of severe allergic reactions after a previous dose or to a vaccine component":
  Elements."The client has history of severe allergic reactions"

