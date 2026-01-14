
/*
 * Library: IMMZD2DTVaricella2DoseLogic (IMMZ.D2.DT.Varicella.2 doses)
 * Rule: Determine if the client is due for a varicella vaccination according to the national immunization schedule
 * Decision Table: 2-dose schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTVaricella2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTVaricellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for varicella vaccination" then "Client is not due for varicella vaccination Guidance"
    when "Client is due for varicella vaccination" then "Client is due for varicella vaccination Guidance"
    when "Varicella immunization schedule is complete" then "Varicella immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for varicella vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for varicella vaccination Case 1":
  Encounter."Client's age is less than 12 months"

/*
@output: Client is not due for varicella vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for varicella vaccination Case 2":
  Encounter."No varicella primary series doses were administered"
    and Encounter."Cient's age is more than or equal to 12 months"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for varicella vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for varicella vaccination Case 3":
  Encounter."One varicella primary series dose was administered"
    and Encounter."The latest varicella dose administered less than 4 weeks ago"

/*
@output: Client is not due for varicella vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for varicella vaccination Case 4":
  Encounter."One varicella primary series dose was administered"
    and Encounter."The latest varicella dose administered more than 4 weeks ago"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for varicella vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for varicella vaccination":
  "Client is not due for varicella vaccination Case 1"
    or "Client is not due for varicella vaccination Case 2"
    or "Client is not due for varicella vaccination Case 3"
    or "Client is not due for varicella vaccination Case 4"

/*
@output: Client is not due for varicella vaccination Guidance
@guidance: Should not vaccinate client with first varicella dose as client's age is less than 12 months. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.
@guidance: Should not vaccinate client with first varicella dose as live vaccine was administered in the past 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.
@guidance: Should not vaccinate client with second varicella dose as the latest varicella dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver when to come back for the second dose.
@guidance: Should not vaccinate client with second varicella dose as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for varicella vaccination Guidance":
  case
    when "Client is not due for varicella vaccination Case 1" then 'Should not vaccinate client with first varicella dose as client\'s age is less than 12 months. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.'
    when "Client is not due for varicella vaccination Case 2" then 'Should not vaccinate client with first varicella dose as live vaccine was administered in the past 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.'
    when "Client is not due for varicella vaccination Case 3" then 'Should not vaccinate client with second varicella dose as the latest varicella dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver when to come back for the second dose.'
    when "Client is not due for varicella vaccination Case 4" then 'Should not vaccinate client with second varicella dose as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for varicella vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for varicella vaccination Case 1":
  Encounter."No varicella primary series doses were administered"
    and Encounter."Cient's age is more than or equal to 12 months"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Client is due for varicella vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for varicella vaccination Case 2":
  Encounter."One varicella primary series dose was administered"
    and Encounter."The latest varicella dose administered more than 4 weeks ago"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Client is due for varicella vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for varicella vaccination":
  "Client is due for varicella vaccination Case 1"
    or "Client is due for varicella vaccination Case 2"

/*
@output: Client is due for varicella vaccination Guidance
@guidance: Should vaccinate client with first varicella dose as no varicella dose was administered, client is within appropriate age range and no live vaccine was administered in past 4 weeks. Check for contraindications.
@guidance: Should vaccinate client with second varicella dose as the latest varicella dose was administered more than 4 weeks ago and no live vaccine was administered in past 4 weeks. Check for contraindications.
*/
define "Client is due for varicella vaccination Guidance":
  case
    when "Client is due for varicella vaccination Case 1" then 'Should vaccinate client with first varicella dose as no varicella dose was administered, client is within appropriate age range and no live vaccine was administered in past 4 weeks. Check for contraindications.'
    when "Client is due for varicella vaccination Case 2" then 'Should vaccinate client with second varicella dose as the latest varicella dose was administered more than 4 weeks ago and no live vaccine was administered in past 4 weeks. Check for contraindications.'
    else ''
  end

/*
@output: Varicella immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Varicella immunization schedule is complete":
  Encounter."Two varicella primary series doses were administered"

/*
@output: Varicella immunization schedule is complete Guidance
@guidance: Varicella immunization schedule is complete. Two varicella primary series doses were administered. Check for any other vaccines due.
*/
define "Varicella immunization schedule is complete Guidance":
  'Varicella immunization schedule is complete. Two varicella primary series doses were administered. Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '21.2' then "Client is not due for varicella vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first varicella dose as client\'s age is less than 12 months. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.'
    when Patient.id = '22.124' then "Client is not due for varicella vaccination Case 2" and "Guidance" = 'Should not vaccinate client with first varicella dose as live vaccine was administered in the past 4 weeks. Check for any other vaccines due and inform the caregiver of when to come back for the first varicella dose.'
    when Patient.id = '23.124' then "Client is due for varicella vaccination Case 1" and "Guidance" = 'Should vaccinate client with first varicella dose as no varicella dose was administered, client is within appropriate age range and no live vaccine was administered in past 4 weeks. Check for contraindications.'
    when Patient.id = '24.13' then "Client is not due for varicella vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second varicella dose as the latest varicella dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver when to come back for the second dose.'
    when Patient.id = '25.134' then "Client is not due for varicella vaccination Case 4" and "Guidance" = 'Should not vaccinate client with second varicella dose as live vaccine was administered in the past 4 weeks. Check for any vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '26.134' then "Client is due for varicella vaccination Case 2" and "Guidance" = 'Should vaccinate client with second varicella dose as the latest varicella dose was administered more than 4 weeks ago and no live vaccine was administered in past 4 weeks. Check for contraindications.'
    when Patient.id = '27.1' then "Varicella immunization schedule is complete" and "Guidance" = 'Varicella immunization schedule is complete. Two varicella primary series doses were administered. Check for any other vaccines due.'
    else 'No test case set'
  end
