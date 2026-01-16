
/*
 * Library: IMMZD2DTRubellaHighLogic (IMMZ.D2.DT.Rubella.High incidence)
 * Rule: Determine if the client is due for a rubella vaccination according to the national immunization schedule
 * Decision Table: Countries with high incidence and mortality from rubella
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTRubellaHighLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTRubellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for rubella vaccination" then "Client is not due for rubella vaccination Guidance"
    when "Client is due for rubella vaccination" then "Client is due for rubella vaccination Guidance"
    when "Rubella immunization schedule is complete" then "Rubella immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for rubella vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rubella vaccination Case 1":
  Encounter."Client's age is less than 9 months"

/*
@output: Client is not due for rubella vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rubella vaccination Case 2":
  Encounter."No rubella primary series dose was administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for rubella vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for rubella vaccination":
  "Client is not due for rubella vaccination Case 1"
    or "Client is not due for rubella vaccination Case 2"

/*
@output: Client is not due for rubella vaccination Guidance
@guidance: Should not vaccinate client with rubella dose as client's age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with rubella dose as live vaccine was administered in the last 4 weeks.
Check for any other vaccines due.
*/
define "Client is not due for rubella vaccination Guidance":
  case
    when "Client is not due for rubella vaccination Case 1" then 'Should not vaccinate client with rubella dose as client\'s age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for rubella vaccination Case 2" then 'Should not vaccinate client with rubella dose as live vaccine was administered in the last 4 weeks.
Check for any other vaccines due.'
    else ''
  end

/*
@output: Client is due for rubella vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for rubella vaccination":
  Encounter."No rubella primary series dose was administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for rubella vaccination Guidance
@guidance: Should vaccinate client with rubella dose as no rubella doses were administered, client is within the appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.
*/
define "Client is due for rubella vaccination Guidance":
  'Should vaccinate client with rubella dose as no rubella doses were administered, client is within the appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'

/*
@output: Rubella immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Rubella immunization schedule is complete":
  Encounter."One rubella primary series dose was administered"

/*
@output: Rubella immunization schedule is complete Guidance
@guidance: Rubella immunization schedule is complete. One rubella primary series dose was administered.
Check for any other vaccines due.
*/
define "Rubella immunization schedule is complete Guidance":
  'Rubella immunization schedule is complete. One rubella primary series dose was administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "Client is not due for rubella vaccination Case 1" and "Guidance" = 'Should not vaccinate client with rubella dose as client\'s age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.123' then "Client is due for rubella vaccination" and "Guidance" = 'Should vaccinate client with rubella dose as no rubella doses were administered, client is within the appropriate age range and no live vaccine was administered in the last 4 weeks.
Check for contraindications.'
    when Patient.id = '10.123' then "Client is not due for rubella vaccination Case 2" and "Guidance" = 'Should not vaccinate client with rubella dose as live vaccine was administered in the last 4 weeks.
Check for any other vaccines due.'
    when Patient.id = '11.1' then "Rubella immunization schedule is complete" and "Guidance" = 'Rubella immunization schedule is complete. One rubella primary series dose was administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
