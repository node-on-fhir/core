
/*
  * Library: IMMZD5DTJEEncounterElements
  */
library IMMZD5DTJEEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTJEElements called JEElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for JE dose
*/
define "Draft Medication Request for JE dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."JE vaccines"


/*
@input: The client is immunocomprised
@pseudocode: "Potential contraindications" = "Immunocompromised"
@decision: Potential contraindications
*/
define "The client is immunocomprised":
  Encounter."The client is immunocompromised"

/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Encounter."The client is pregnant"

