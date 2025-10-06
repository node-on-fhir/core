
/*
 * Library: IMMZD5DTDTPCILogic (IMMZ.D5.DT.DTP contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTDTPCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTDTPEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Draft Medication Request ID for Tetanus dose
*/
define "Draft Medication Request ID for Tetanus dose":
	First(Encounter."Draft Medication Request for Tetanus dose").id

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    when "Tetanus vaccination is contraindicated" then "Tetanus vaccination is contraindicated Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed" (where "Vaccine type" = "Pertussis-containing vaccines")
*/
define "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has a history of anaphylactic reactions"

/*
@output: Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with pertussis and/or tetanus if the client has had a severe anaphylactic reaction to a vaccine component or reaction following a prior dose.
*/
define "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with pertussis and/or tetanus if the client has had a severe anaphylactic reaction to a vaccine component or reaction following a prior dose.'

/*
@output: Tetanus vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated" (where "Vaccine type" = "Tetanus -containing vaccines")
*/
define "Tetanus vaccination is contraindicated":
  Encounter."The client currently has a severe acute illness"

/*
@output: Tetanus vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with tetanus as tetanus vaccination is contraindicated for clients with severe acute illness
*/
define "Tetanus vaccination is contraindicated Guidance":
  'Do not vaccinate client with tetanus as tetanus vaccination is contraindicated for clients with severe acute illness'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '88.CI166' then "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with pertussis and/or tetanus if the client has had a severe anaphylactic reaction to a vaccine component or reaction following a prior dose.'
    when Patient.id = '89.CI188' then "Tetanus vaccination is contraindicated" and "Guidance" = 'Do not vaccinate client with tetanus as tetanus vaccination is contraindicated for clients with severe acute illness'
    else 'No test case set'
  end
