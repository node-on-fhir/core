
/*
 * Library: IMMZD5DTMalariaCILogic (IMMZ.D5.DT.Malaria contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTMalariaCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTMalariaEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Malaria dose
  */
  define "Draft Medication Request ID for Malaria dose":
    First(Encounter."Draft Medication Request for Malaria dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" =  "Further evaluation needed"
*/
define "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has hypersensitivity to any of the vaccine components"

/*
@output: Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with RTS,S/AS01 vaccine if client has severe hypersensitivity to any of the vaccine components.
*/
define "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with RTS,S/AS01 vaccine if client has severe hypersensitivity to any of the vaccine components.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '23.0' then "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with RTS,S/AS01 vaccine if client has severe hypersensitivity to any of the vaccine components.'
    else 'No test case set'
  end
