
/*
 * Library: IMMZD5DTRotavirusCILogic (IMMZ.D5.DT.Rotavirus contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTRotavirusCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTRotavirusEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Draft Medication Request ID for Rotavirus dose
*/
define "Draft Medication Request ID for Rotavirus dose":
	First(Encounter."Draft Medication Request for Rotavirus dose").id

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Rotavirus vaccination is contraindicated" then "Rotavirus vaccination is contraindicated Guidance"
    when "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Rotavirus vaccination is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rotavirus vaccination is contraindicated Case 1":
  Encounter."The client has prior history of intussusception"

/*
@output: Rotavirus vaccination is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rotavirus vaccination is contraindicated Case 2":
  Encounter."The client has severe immunodeficiency"

/*
@output: Rotavirus vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Rotavirus vaccination is contraindicated":
  "Rotavirus vaccination is contraindicated Case 1"
    or "Rotavirus vaccination is contraindicated Case 2"

/*
@output: Rotavirus vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with rotavirus as rotavirus vaccination is contraindicated for clients with prior history of intussusception.
@guidance: Do not vaccinate client with rotavirus as rotavirus vaccincation is contraindicated for clients with severe immunodeficiency, including severe combined immunodeficiency.
*/
define "Rotavirus vaccination is contraindicated Guidance":
  case
    when "Rotavirus vaccination is contraindicated Case 1" then 'Do not vaccinate client with rotavirus as rotavirus vaccination is contraindicated for clients with prior history of intussusception.'
    when "Rotavirus vaccination is contraindicated Case 2" then 'Do not vaccinate client with rotavirus as rotavirus vaccincation is contraindicated for clients with severe immunodeficiency, including severe combined immunodeficiency.'
    else ''
  end

/*
@output: Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1":
  Encounter."The client has a history of severe allergic reactions"

/*
@output: Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2":
  Encounter."The client has history of anaphylactic reactions"

/*
@output: Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1"
    or "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2"

/*
@output: Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with rotavirus if client had severe allergic reactions to a previous rotavirus vaccine dose or rotavirus vaccine components.
Check if the client has no known severe hypersensitivity to rotavirus vaccines components.
@guidance: Do not vaccinate client with rotavirus if client has history of anaphylactic reaction to a previous rotavirus vaccine dose or rotavirus vaccine components.
*/
define "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1" then 'Do not vaccinate client with rotavirus if client had severe allergic reactions to a previous rotavirus vaccine dose or rotavirus vaccine components.
Check if the client has no known severe hypersensitivity to rotavirus vaccines components.'
    when "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2" then 'Do not vaccinate client with rotavirus if client has history of anaphylactic reaction to a previous rotavirus vaccine dose or rotavirus vaccine components.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 1":
  Encounter."The client has altered immunocompetence"

/*
@output: Clinical judgement is required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 2":
  Encounter."The client has spina bifida"

/*
@output: Clinical judgement is required. Create a clinical note Case 3
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 3":
  Encounter."The client has bladder exstrophy"

/*
@output: Clinical judgement is required. Create a clinical note Case 4
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 4":
  Encounter."The client has chronic gastrointestinal disease"

/*
@output: Clinical judgement is required. Create a clinical note Case 5
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 5":
  Encounter."The client has acute gastroenteritis"

/*
@output: Clinical judgement is required. Create a clinical note Case 6
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 6":
  Encounter."The client has moderate to severe fever"

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  "Clinical judgement is required. Create a clinical note Case 1"
    or "Clinical judgement is required. Create a clinical note Case 2"
    or "Clinical judgement is required. Create a clinical note Case 3"
    or "Clinical judgement is required. Create a clinical note Case 4"
    or "Clinical judgement is required. Create a clinical note Case 5"
    or "Clinical judgement is required. Create a clinical note Case 6"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Client has altered immunocompetence other than severe combined immunodeficiency, consider risks of vaccination and make a judgement.
@guidance: Client has spina bifida, consider risks of vaccination and make a judgement.
@guidance: Client has bladder exstrophy, consider risks of vaccination and make a judgement.
@guidance: Client has chronic gastrointestinal disease, consider risks of vaccination and make a judgement.
@guidance: Client has acute gastroenteritis, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.
@guidance: Client has moderate to severe fever, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Clinical judgement is required. Create a clinical note Case 1" then 'Client has altered immunocompetence other than severe combined immunodeficiency, consider risks of vaccination and make a judgement.'
    when "Clinical judgement is required. Create a clinical note Case 2" then 'Client has spina bifida, consider risks of vaccination and make a judgement.'
    when "Clinical judgement is required. Create a clinical note Case 3" then 'Client has bladder exstrophy, consider risks of vaccination and make a judgement.'
    when "Clinical judgement is required. Create a clinical note Case 4" then 'Client has chronic gastrointestinal disease, consider risks of vaccination and make a judgement.'
    when "Clinical judgement is required. Create a clinical note Case 5" then 'Client has acute gastroenteritis, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.'
    when "Clinical judgement is required. Create a clinical note Case 6" then 'Client has moderate to severe fever, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '25.0' then "Rotavirus vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with rotavirus as rotavirus vaccination is contraindicated for clients with prior history of intussusception.'
    when Patient.id = '26.0' then "Rotavirus vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with rotavirus as rotavirus vaccincation is contraindicated for clients with severe immunodeficiency, including severe combined immunodeficiency.'
    when Patient.id = '27.0' then "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'Do not vaccinate client with rotavirus if client had severe allergic reactions to a previous rotavirus vaccine dose or rotavirus vaccine components.
Check if the client has no known severe hypersensitivity to rotavirus vaccines components.'
    when Patient.id = '28.0' then "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'Do not vaccinate client with rotavirus if client has history of anaphylactic reaction to a previous rotavirus vaccine dose or rotavirus vaccine components.'
    when Patient.id = '29.0' then "Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'Client has altered immunocompetence other than severe combined immunodeficiency, consider risks of vaccination and make a judgement.'
    when Patient.id = '30.0' then "Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'Client has spina bifida, consider risks of vaccination and make a judgement.'
    when Patient.id = '31.0' then "Clinical judgement is required. Create a clinical note Case 3" and "Guidance" = 'Client has bladder exstrophy, consider risks of vaccination and make a judgement.'
    when Patient.id = '32.0' then "Clinical judgement is required. Create a clinical note Case 4" and "Guidance" = 'Client has chronic gastrointestinal disease, consider risks of vaccination and make a judgement.'
    when Patient.id = '33.0' then "Clinical judgement is required. Create a clinical note Case 5" and "Guidance" = 'Client has acute gastroenteritis, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.'
    when Patient.id = '34.0' then "Clinical judgement is required. Create a clinical note Case 6" and "Guidance" = 'Client has moderate to severe fever, consider risks of vaccination and make a judgement. Consider delaying rotavirus vaccination.'
    else 'No test case set'
  end
