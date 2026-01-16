
/*
  * Library: IMMZD5DTPneumococcalElements
  */
library IMMZD5DTPneumococcalElements

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
@input: The client has a history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential Contraindications
*/
define "The client has a history of anaphylactic reactions":
  Elements."The client has history of anaphylactic reactions"

/*
@input: The client has a history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential Contraindications
*/
define "The client has a history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

