
/*
  * Library: IMMZD5DTBCGElements
  */
library IMMZD5DTBCGElements

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
@internal: Draft Medication Request for BCG dose
*/
define "Draft Medication Request for BCG dose":
  Elements."Draft Medication Request for Patient" MR
    where MR.medication in Concepts."BCG vaccines"

/*
@input: The client is pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
@code: The client is pregnant-52
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "The client is pregnant":
  Elements."The client is pregnant"

/*
@input: The client has history of severe allergic reactions
@pseudocode: '"Potential contraindications" = "Severe allergic reactions"
@code: The client has history of severe allergic reactions-60
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "The client has history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

/*
@input: The client has immunodeficiency syndromes
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
@code: The client has immunodeficiency syndromes-60
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "The client has immunodeficiency syndromes":
  Elements."The client has immunodeficiency syndromes"

/*
@input: The client is exposed to immunosuppressive treatment
@pseudocode: "Potential contraindications" = "Exposed to immunosuppressive treatment"
@code: The client is exposed to immunosuppressive treatment-72
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "The client is exposed to immunosuppressive treatment":
  Elements."The client is exposed to immunosuppressive treatment"

/*
@input: Client's age is less than 1 year
@pseudocode: "Age" < 1 year
@code: Client's age is less than 1 year-14
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "Client's age is less than 1 year":
  Elements."Current Patient Age In Years" < 1

/*
@input: Client's age is more than or equal to 1 year
@pseudocode: "Age" ≥ 1 year
@code: Client's age is more than or equal to 1 year-14
@decision: IMMZ.D5.DT.BCG contraindications
*/
define "Client's age is more than or equal to 1 year":
  Elements."Current Patient Age In Years" >= 1
