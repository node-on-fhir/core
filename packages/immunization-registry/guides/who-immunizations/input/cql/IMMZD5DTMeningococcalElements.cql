
/*
  * Library: IMMZD5DTMeningococcalElements
  */
library IMMZD5DTMeningococcalElements

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
@internal: Draft Medication Request for Meningococcal dose
*/
define "Draft Medication Request for Meningococcal dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Meningococcal vaccines"


/*
@input: The client has history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

