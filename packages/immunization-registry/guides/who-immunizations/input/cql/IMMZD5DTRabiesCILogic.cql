
/*
 * Library: IMMZD5DTRabiesCILogic (IMMZ.D5.DT.Rabies contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTRabiesCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTRabiesEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Rabies dose
  */
  define "Draft Medication Request ID for Rabies dose":
    First(Encounter."Draft Medication Request for Rabies dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  Encounter."The client has history of severe allergic reactions"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Check if the client has a history of severe hypersensitivity to any of the components or to excipients listed by the vaccine manufacturer. If so, provide an alternative rabies vaccine product for PreP.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  'Check if the client has a history of severe hypersensitivity to any of the components or to excipients listed by the vaccine manufacturer. If so, provide an alternative rabies vaccine product for PreP.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '17.1' then "Clinical judgement is required. Create a clinical note" and "Guidance" = 'Check if the client has a history of severe hypersensitivity to any of the components or to excipients listed by the vaccine manufacturer. If so, provide an alternative rabies vaccine product for PreP.'
    else 'No test case set'
  end
