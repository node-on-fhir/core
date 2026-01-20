
/*
 * Library: IMMZD5DTPneumococcalCILogic (IMMZ.D5.DT.Pneumococcal contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential Contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTPneumococcalCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTPneumococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    when "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." then "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has a history of anaphylactic reactions"

/*
@output: Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with pneumococcal if client has a history of anaphylactic reaction to any component of the vaccine.
*/
define "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with pneumococcal if client has a history of anaphylactic reaction to any component of the vaccine.'

/*
@output: Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.":
  Encounter."The client has a history of severe allergic reactions"

/*
@output: Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance
@guidance: Do not vaccinate client with pneumococcal if client has a history of severe allergic reactions to any component of the vaccine.
*/
define "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note. Guidance":
  'Do not vaccinate client with pneumococcal if client has a history of severe allergic reactions to any component of the vaccine.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '61.1' then "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with pneumococcal if client has a history of anaphylactic reaction to any component of the vaccine.'
    when Patient.id = '62.1' then "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." and "Guidance" = 'Do not vaccinate client with pneumococcal if client has a history of severe allergic reactions to any component of the vaccine.'
    else 'No test case set'
  end
