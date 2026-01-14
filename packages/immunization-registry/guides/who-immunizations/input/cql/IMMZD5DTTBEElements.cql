
/*
  * Library: IMMZD5DTTBEElements
  */
library IMMZD5DTTBEElements

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
@internal: Draft Medication Request for TBE dose
*/
define "Draft Medication Request for TBE dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."TBE vaccines"


/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Elements."The client is pregnant"

/*
@input: The client has moderate to severe fever
@pseudocode: "Potential contraindications" = "Moderate to severe fever"
@decision: Potential contraindications
*/
define "The client has moderate to severe fever":
  Elements."The client has moderate to severe fever"

