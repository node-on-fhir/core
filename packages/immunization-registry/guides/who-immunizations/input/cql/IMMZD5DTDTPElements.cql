
/*
  * Library: IMMZD5DTDTPElements
  */
library IMMZD5DTDTPElements

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
@internal: Draft Medication Request for Tetanus dose
*/
define "Draft Medication Request for Tetanus dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Tetanus-containing vaccines"

/*
@input: The client has a history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential contraindications
*/
define "The client has a history of anaphylactic reactions":
  Elements."The client has history of anaphylactic reactions"

/*
@input: The client currently has a severe acute illness
@pseudocode: "Potential contraindications" = "Severe acute illness"
@decision: Potential contraindications
*/
define "The client currently has a severe acute illness":
  Elements."The client currently has a severe acute illness"

