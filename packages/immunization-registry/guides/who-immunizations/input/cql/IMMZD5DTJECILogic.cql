
/*
 * Library: IMMZD5DTJECILogic (IMMZ.D5.DT.JE contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Potential contraindications
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTJECILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTJEEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for JE dose
  */
  define "Draft Medication Request ID for JE dose":
    First(Encounter."Draft Medication Request for JE dose").id


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
@output: Clinical judgement is required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 1":
  Encounter."The client is immunocomprised"

/*
@output: Clinical judgement is required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 2":
  Encounter."The client is currently pregnant"

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  "Clinical judgement is required. Create a clinical note Case 1"
    or "Clinical judgement is required. Create a clinical note Case 2"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: The client is immunocompromised, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred in immunocompromised clients.
@guidance: The client is currently pregnant, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred over live attenuated or live recombinant vaccines.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Clinical judgement is required. Create a clinical note Case 1" then 'The client is immunocompromised, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred in immunocompromised clients.'
    when "Clinical judgement is required. Create a clinical note Case 2" then 'The client is currently pregnant, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred over live attenuated or live recombinant vaccines.'
    else ''
  end


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '40.0' then "Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'The client is immunocompromised, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred in immunocompromised clients.'
    when Patient.id = '41.0' then "Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'The client is currently pregnant, consider risks of vaccination and make a judgement. Inactivated Vero cell-derived vaccines are preferred over live attenuated or live recombinant vaccines.'
    else 'No test case set'
  end
