
/*
  * Library: IMMZD5DTRotavirusElements
  */
library IMMZD5DTRotavirusElements

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
@internal: Draft Medication Request for Rotavirus dose
*/
define "Draft Medication Request for Rotavirus dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."Rotavirus vaccines"

/*
@input: The client has prior history of intussusception
@pseudocode: "Potential contraindications" = "Prior history of intussusception"
@decision: Potential contraindications
*/
define "The client has prior history of intussusception":
  Elements."The client has prior history of intussusception"

/*
@input: The client has severe immunodeficiency
@pseudocode: '"Potential contraindications" = "Immunodeficiency syndromes"
@decision: Potential contraindications
*/
define "The client has severe immunodeficiency":
  Elements."The client has immunodeficiency syndromes"

/*
@input: The client has a history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
@decision: Potential contraindications
*/
define "The client has a history of severe allergic reactions":
  Elements."The client has history of severe allergic reactions"

/*
@input: The client has history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
@decision: Potential contraindications
*/
define "The client has history of anaphylactic reactions":
  Elements."The client has history of anaphylactic reactions"

/*
@input: The client has altered immunocompetence
@pseudocode: "Potential contraindications" = "Altered immunocompetence"
@decision: Potential contraindications
*/
define "The client has altered immunocompetence":
  Elements."The client has altered immunocompetence"

/*
@input: The client has spina bifida
@pseudocode: "Potential contraindications" = "Spina bifida"
@decision: Potential contraindications
*/
define "The client has spina bifida":
  Elements."The client has spina bifida"

/*
@input: The client has bladder exstrophy
@pseudocode: "Potential contraindications" = "Bladder exstrophy"
@decision: Potential contraindications
*/
define "The client has bladder exstrophy":
  Elements."The client has bladder exstrophy"

/*
@input: The client has chronic gastrointestinal disease
@pseudocode: "Potential contraindications" = "Chronic gastrointestinal disease"
@decision: Potential contraindications
*/
define "The client has chronic gastrointestinal disease":
  Elements."The client has chronic gastrointestinal disease"

/*
@input: The client has acute gastroenteritis
@pseudocode: "Potential contraindications" = "Acute gastroenteritis"
@decision: Potential contraindications
*/
define "The client has acute gastroenteritis":
  Elements."The client has acute gastroenteritis"

/*
@input: The client has moderate to severe fever
@pseudocode: "Potential contraindications" = "Moderate to severe fever"
@decision: Potential contraindications
*/
define "The client has moderate to severe fever":
  Elements."The client has moderate to severe fever"

