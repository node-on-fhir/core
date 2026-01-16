
/*
  * Library: IMMZD5DTMumpsElements
  */
library IMMZD5DTMumpsElements

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
@internal: Draft Medication Request for Mumps dose
*/
define "Draft Medication Request for Mumps dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Mumps-containing vaccines"

/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Elements."The client is pregnant"

/*
@input: The client has allergy to vaccine components
@pseudocode: '"Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has allergy to vaccine components":
  Elements."The client has history of severe allergic reactions"

/*
@input: The client has immune deficiency
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
@decision: Potential contraindications
*/
define "The client has immune deficiency":
  Elements."The client has immunodeficiency syndromes"

/*
@input: The client is severely immunosuppressed
@pseudocode: "Potential contraindications" = "Severely immunosuppressed"
@decision: Potential contraindications
*/
define "The client is severely immunosuppressed":
  Elements."The client is severely immunosuppressed"

