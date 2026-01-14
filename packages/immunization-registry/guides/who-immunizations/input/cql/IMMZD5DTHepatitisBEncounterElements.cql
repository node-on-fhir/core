
/*
  * Library: IMMZD5DTHepatitisBEncounterElements
  */
library IMMZD5DTHepatitisBEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZEncounterElements called Encounter

include IMMZD5DTHepatitisBElements called HepatitisBElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Hepatitis B dose
*/
define "Draft Medication Request for Hepatitis B dose":
  Encounter."Draft Medication Request for Patient" MR
    where MR.medication in Concepts."Hepatitis B-containing vaccines"

/*
@input: The client has history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@code: The client has history of severe allergic reactions-59
@decision: IMMZ.D5.DT.Hepatitis B contraindications
*/
define "The client has history of severe allergic reactions":
  Encounter."The client has history of severe allergic reactions"
