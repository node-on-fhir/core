
/*
  * Library: IMMZD5DTMalariaElements
  */
library IMMZD5DTMalariaElements

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
@internal: Draft Medication Request for Malaria dose
*/
define "Draft Medication Request for Malaria dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Malaria vaccines"


/*
@input: The client has hypersensitivity to any of the vaccine components
@pseudocode: "Potential contraindications" = "Hypersensitivity to vaccine components"
@decision: Potential contraindications
*/
define "The client has hypersensitivity to any of the vaccine components":
  Elements."The client has hypersensitivity to any component of the vaccine"

