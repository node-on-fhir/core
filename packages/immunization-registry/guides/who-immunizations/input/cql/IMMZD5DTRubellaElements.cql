
/*
  * Library: IMMZD5DTRubellaElements
  */
library IMMZD5DTRubellaElements

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
@internal: Draft Medication Request for Rubella dose
*/
define "Draft Medication Request for Rubella dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Rubella-containing vaccines"


/*
@input: The client is currently pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@decision: Potential contraindications
*/
define "The client is currently pregnant":
  Elements."The client is pregnant"

/*
@input: The client is planning to get pregnant in next month
@pseudocode: "Potential contraindications" = "Planning to get pregnant in the next month"
@decision: Potential contraindications
*/
define "The client is planning to get pregnant in next month":
  Elements."The client is planning to get pregnant in next month"

/*
@input: The client is receiving blood products
@pseudocode: "Potential contraindications" = "Receiving blood products"
@decision: Potential contraindications
*/
define "The client is receiving blood products":
  Elements."The client is receiving blood products"

/*
@input: The client has history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

/*
@input: The client has symptomatic HIV infection
@pseudocode: "Potential contraindications" = "Symptomatic HIV infection"
@decision: Potential contraindications
*/
define "The client has symptomatic HIV infection":
  Elements."The client has a symptomatic HIV infection"

/*
@input: The client has TB disease
@pseudocode: "Potential contraindications" = "TB disease"
@decision: Potential contraindications
*/
define "The client has TB disease":
  Elements."The client has TB disease"

/*
@input: The client has immunodeficiency syndromes
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
@decision: Potential contraindications
*/
define "The client has immunodeficiency syndromes":
  Elements."The client has immunodeficiency syndromes"

/*
@input: The client is exposed to immunosuppressive treatment
@pseudocode: "Potential contraindications" = "Exposed to immunosuppressive treatment"
@decision: Potential contraindications
*/
define "The client is exposed to immunosuppressive treatment":
  Elements."The client is exposed to immunosuppressive treatment"

