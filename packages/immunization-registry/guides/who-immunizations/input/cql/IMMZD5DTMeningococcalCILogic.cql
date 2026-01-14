
/*
 * Library: IMMZD5DTMeningococcalCILogic (IMMZ.D5.DT.Meningococcal contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTMeningococcalCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTMeningococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Meningococcal dose
  */
  define "Draft Medication Request ID for Meningococcal dose":
    First(Encounter."Draft Medication Request for Meningococcal dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" (where "Type of meningococcal dose" = "Polysaccharide vaccine") = "Further evaluation needed"
*/
define "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with meningococcal if client has history of severe allergic reaction to any component of the meningococcal vaccine.
*/
define "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with meningococcal if client has history of severe allergic reaction to any component of the meningococcal vaccine.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '78.0' then "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with meningococcal if client has history of severe allergic reaction to any component of the meningococcal vaccine.'
    else 'No test case set'
  end
