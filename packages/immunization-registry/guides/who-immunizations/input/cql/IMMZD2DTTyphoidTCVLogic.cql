
/*
 * Library: IMMZD2DTTyphoidTCVLogic (IMMZ.D2.DT.Typhoid.TCV)
 * Rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
 * Decision Table: Typhoid conjugate vaccine (TCV) schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTTyphoidTCVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTTyphoidEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for Typhoid vaccination" then "Client is not due for Typhoid vaccination Guidance"
    when "Client is due for Typhoid vaccination" then "Client is due for Typhoid vaccination Guidance"
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    when "Typhoid immunization schedule is complete" then "Typhoid immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Typhoid vaccination":
  Encounter."Client's age is less than 6 months"

/*
@output: Client is not due for Typhoid vaccination Guidance
@guidance: Should not vaccinate client with typhoid dose as client's age is less than 6 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
*/
define "Client is not due for Typhoid vaccination Guidance":
  'Should not vaccinate client with typhoid dose as client\'s age is less than 6 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'

/*
@output: Client is due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Typhoid vaccination":
  Encounter."No typhoid primary series doses were administered"
    and Encounter."Client's age is between 6 months and 45 years"

/*
@output: Client is due for Typhoid vaccination Guidance
@guidance: Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.
*/
define "Client is due for Typhoid vaccination Guidance":
  'Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.'

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  Encounter."No typhoid primary series doses were administered"
    and Encounter."Client's age is more than or equal to 45 years"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Member States should update this action according to the national immunization programme.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  'Member States should update this action according to the national immunization programme.'

/*
@output: Typhoid immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Typhoid immunization schedule is complete":
  Encounter."One typhoid primary series dose was administered"

/*
@output: Typhoid immunization schedule is complete Guidance
@guidance: Typhoid immunization schedule is complete. One typhoid primary series dose was administered.
Check for any other vaccines due.
*/
define "Typhoid immunization schedule is complete Guidance":
  'Typhoid immunization schedule is complete. One typhoid primary series dose was administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "Client is not due for Typhoid vaccination" and "Guidance" = 'Should not vaccinate client with typhoid dose as client\'s age is less than 6 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.12' then "Client is due for Typhoid vaccination" and "Guidance" = 'Should vaccinate client with typhoid dose as no typhoid doses were administered and client is within appropriate age range.
Check for contraindications.'
    when Patient.id = '10.12' then "Clinical judgement is required. Create a clinical note" and "Guidance" = 'Member States should update this action according to the national immunization programme.'
    when Patient.id = '11.1' then "Typhoid immunization schedule is complete" and "Guidance" = 'Typhoid immunization schedule is complete. One typhoid primary series dose was administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
