
/*
  * Library: IMMZD5DTMumpsEncounterElements
  */
library IMMZD5DTMumpsEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTMumpsElements called MumpsElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Mumps dose
*/
define "Draft Medication Request for Mumps dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Mumps-containing vaccines"

/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Encounter."The client is pregnant"

/*
@input: The client has allergy to vaccine components
@pseudocode: '"Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has allergy to vaccine components":
  Encounter."The client has history of severe allergic reactions"

/*
@input: The client has immune deficiency
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
@decision: Potential contraindications
*/
define "The client has immune deficiency":
  Encounter."The client has immunodeficiency syndromes"

/*
@input: The client is severely immunosuppressed
@pseudocode: "Potential contraindications" = "Severely immunosuppressed"
@decision: Potential contraindications
*/
define "The client is severely immunosuppressed":
  Encounter."The client is severely immunosuppressed"

