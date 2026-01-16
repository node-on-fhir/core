
/*
  * Library: IMMZD5DTMalariaEncounterElements
  */
library IMMZD5DTMalariaEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTMalariaElements called MalariaElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Malaria dose
*/
define "Draft Medication Request for Malaria dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Malaria vaccines"


/*
@input: The client has hypersensitivity to any of the vaccine components
@pseudocode: "Potential contraindications" = "Hypersensitivity to vaccine components"
@decision: Potential contraindications
*/
define "The client has hypersensitivity to any of the vaccine components":
  Encounter."The client has hypersensitivity to any component of the vaccine"

