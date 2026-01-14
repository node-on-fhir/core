
/*
  * Library: IMMZD5DTVaricellaEncounterElements
  */
library IMMZD5DTVaricellaEncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZD5DTVaricellaElements called VaricellaElements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/*
@internal: Draft Medication Request for Varicella dose
*/
define "Draft Medication Request for Varicella dose":
  Encounter."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Varicella-containing vaccines"

/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Encounter."The client is pregnant"

/*
@input: The client is planning to get pregnant in the next month
@pseudocode: "Potential contraindications" = "Planning to get pregnant in the next month"
@decision: Potential contraindications
*/
define "The client is planning to get pregnant in the next month":
  Encounter."The client is planning to get pregnant in next month"

/*
@input: The client has immune deficiency
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
@decision: Potential contraindications
*/
define "The client has immune deficiency":
  Encounter."The client has immunodeficiency syndromes"

/*
@input: The client is immunocompromised
@pseudocode: "Potential contraindications" = "Immunocompromised"
@decision: Potential contraindications
*/
define "The client is immunocompromised":
  Encounter."The client is immunocompromised"

/*
@input: The client is receiving or has received medications that may be immunosuppressive
@pseudocode: "Potential contraindications" = "Exposed to immunosuppressive treatment"
@decision: Potential contraindications
*/
define "The client is receiving or has received medications that may be immunosuppressive":
  Encounter."The client is exposed to immunosuppressive treatment"

