
/*
 * Library: IMMZD2DTYellowfeverLogic (IMMZ.D2.DT.Yellow fever)
 * Rule: Determine if the client is due for a yellow fever vaccination according to the national immunization schedule
 * Decision Table: IMMZ.D2.DT.Yellow fever
 * Trigger: IMMZ.D2 Determine required vaccination(s) in any
 */
library IMMZD2DTYellowfeverLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTYellowfeverEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for yellow fever vaccination" then "Client is not due for yellow fever vaccination Guidance"
    when "Client is due for yellow fever vaccination" then "Client is due for yellow fever vaccination Guidance"
    when "Yellow fever immunization schedule is complete" then "Yellow fever immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for yellow fever vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for yellow fever vaccination Case 1":
  Encounter."No yellow fever primary series doses were administered"
    and Encounter."Client's age is less than 9 months"

/*
@output: Client is not due for yellow fever vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for yellow fever vaccination Case 2":
  Encounter."No yellow fever primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for yellow fever vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for yellow fever vaccination":
  "Client is not due for yellow fever vaccination Case 1"
    or "Client is not due for yellow fever vaccination Case 2"

/*
@output: Client is not due for yellow fever vaccination Guidance
@guidance: Should not vaccinate client with yellow fever dose as client's age is less than 9 months. Check for any vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with yellow fever dose as live vaccine was administered in the past 4 weeks. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.
*/
define "Client is not due for yellow fever vaccination Guidance":
  case
    when "Client is not due for yellow fever vaccination Case 1" then 'Should not vaccinate client with yellow fever dose as client\'s age is less than 9 months. Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for yellow fever vaccination Case 2" then 'Should not vaccinate client with yellow fever dose as live vaccine was administered in the past 4 weeks. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    else ''
  end

/*
@output: Client is due for yellow fever vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for yellow fever vaccination":
  Encounter."No yellow fever primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Client is due for yellow fever vaccination Guidance
@guidance: Should vaccinate client with yellow fever dose as no yellow fever dose was administered, client is within appropriate age range and no live vaccine was administered in the past 4 weeks. 
Check for contraindications.
*/
define "Client is due for yellow fever vaccination Guidance":
  'Should vaccinate client with yellow fever dose as no yellow fever dose was administered, client is within appropriate age range and no live vaccine was administered in the past 4 weeks. 
Check for contraindications.'

/*
@output: Yellow fever immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Yellow fever immunization schedule is complete":
  Encounter."One yellow fever primary series dose was administered"

/*
@output: Yellow fever immunization schedule is complete Guidance
@guidance: Yellow fever immunization schedule is complete. One yellow fever primary series dose was administered. 
Check for any other vaccines due.
*/
define "Yellow fever immunization schedule is complete Guidance":
  'Yellow fever immunization schedule is complete. One yellow fever primary series dose was administered. 
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '07.01' then "Client is not due for yellow fever vaccination Case 1" and "Guidance" = 'Should not vaccinate client with yellow fever dose as client\'s age is less than 9 months. Check for any vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '08.012' then "Client is not due for yellow fever vaccination Case 2" and "Guidance" = 'Should not vaccinate client with yellow fever dose as live vaccine was administered in the past 4 weeks. 
Check for any vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '09.012' then "Client is due for yellow fever vaccination" and "Guidance" = 'Should vaccinate client with yellow fever dose as no yellow fever dose was administered, client is within appropriate age range and no live vaccine was administered in the past 4 weeks. 
Check for contraindications.'
    when Patient.id = '10.0' then "Yellow fever immunization schedule is complete" and "Guidance" = 'Yellow fever immunization schedule is complete. One yellow fever primary series dose was administered. 
Check for any other vaccines due.'
    else 'No test case set'
  end
