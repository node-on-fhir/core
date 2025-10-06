
/*
 * Library: IMMZD2DTJELALogic (IMMZ.D2.DT.JE.Live attenuated vaccine)
 * Rule: Determine if the client is due for a Japanese encephalitis (JE) vaccination according to the national immunization schedule
 * Decision Table: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTJELALogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTJEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for JE vaccination" then "Client is not due for JE vaccination Guidance"
    when "Client is due for JE vaccination" then "Client is due for JE vaccination Guidance"
    when "JE immunization schedule is complete" then "JE immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for JE vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination Case 1":
  Encounter."Client's age is less than 8 months"

/*
@output: Client is not due for JE vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination Case 2":
  Encounter."No JE primary series doses were administered"
    and Encounter."Client's age is more than or equal to 8 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for JE vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for JE vaccination":
  "Client is not due for JE vaccination Case 1"
    or "Client is not due for JE vaccination Case 2"

/*
@output: Client is not due for JE vaccination Guidance
@guidance: Should not vaccinate client with JE dose as client's age is less than 8 months. Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.
@guidance: Should not vaccinate client with JE dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first JE dose.
*/
define "Client is not due for JE vaccination Guidance":
  case
    when "Client is not due for JE vaccination Case 1" then 'Should not vaccinate client with JE dose as client\'s age is less than 8 months. Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.'
    when "Client is not due for JE vaccination Case 2" then 'Should not vaccinate client with JE dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first JE dose.'
    else ''
  end

/*
@output: Client is due for JE vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for JE vaccination":
  Encounter."No JE primary series doses were administered"
    and Encounter."Client's age is more than or equal to 8 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for JE vaccination Guidance
@guidance: Should vaccinate client with JE dose as no JE dose was administered, client is within the appropriate age range and no live vaccine was administered in last 4 weeks. Check for contraindications.
*/
define "Client is due for JE vaccination Guidance":
  'Should vaccinate client with JE dose as no JE dose was administered, client is within the appropriate age range and no live vaccine was administered in last 4 weeks. Check for contraindications.'

/*
@output: JE immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "JE immunization schedule is complete":
  Encounter."One JE primary series dose was administered"

/*
@output: JE immunization schedule is complete Guidance
@guidance: JE immunization schedule is complete. One JE primary series dose was administered. Check for any other vaccines due.
*/
define "JE immunization schedule is complete Guidance":
  'JE immunization schedule is complete. One JE primary series dose was administered. Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '20.1' then "Client is not due for JE vaccination Case 1" and "Guidance" = 'Should not vaccinate client with JE dose as client\'s age is less than 8 months. Check for any vaccines due and inform the caregiver of when to come back for the first JE dose.'
    when Patient.id = '21.012' then "Client is due for JE vaccination" and "Guidance" = 'Should vaccinate client with JE dose as no JE dose was administered, client is within the appropriate age range and no live vaccine was administered in last 4 weeks. Check for contraindications.'
    when Patient.id = '22.012' then "Client is not due for JE vaccination Case 2" and "Guidance" = 'Should not vaccinate client with JE dose as live vaccine was administered in the last 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first JE dose.'
    when Patient.id = '23.0' then "JE immunization schedule is complete" and "Guidance" = 'JE immunization schedule is complete. One JE primary series dose was administered. Check for any other vaccines due.'
    else 'No test case set'
  end
