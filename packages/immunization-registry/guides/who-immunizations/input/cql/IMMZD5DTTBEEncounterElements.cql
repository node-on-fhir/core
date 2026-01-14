
/*
  * Library: IMMZD5DTTBEEncounterElements
  */
library IMMZD5DTTBEEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTTBEElements called TBEElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for TBE dose
*/
define "Draft Medication Request for TBE dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."TBE vaccines"


/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Encounter."The client is pregnant"

/*
@input: The client has moderate to severe fever
@pseudocode: "Potential contraindications" = "Moderate to severe fever"
@decision: Potential contraindications
*/
define "The client has moderate to severe fever":
  Encounter."The client has moderate to severe fever"

