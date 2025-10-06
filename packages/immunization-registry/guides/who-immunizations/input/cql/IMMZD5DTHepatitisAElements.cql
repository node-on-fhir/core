
/*
  * Library: IMMZD5DTHepatitisAElements
  */
library IMMZD5DTHepatitisAElements

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
@internal: Draft Medication Request for Hepatitis A dose
*/
define "Draft Medication Request for Hepatitis A dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Hepatitis A-containing vaccines"


/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Elements."The client is pregnant"

/*
@input: The client is severely immunocompromised
@pseudocode: "Potential contraindications" = "Severely immunocompromised"
@decision: Potential contraindications
*/
define "The client is severely immunocompromised":
  Elements."The client is severely immunocompromised"

/*
@input: The client has a history of severe allergic reactions
@pseudocode: '"Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has a history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

