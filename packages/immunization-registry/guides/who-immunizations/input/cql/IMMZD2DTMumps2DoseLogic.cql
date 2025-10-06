
/*
 * Library: IMMZD2DTMumps2DoseLogic (IMMZ.D2.DT.Mumps)
 * Rule: Determine if the client is due for a mumps vaccination according to the national immunization schedule
 * Decision Table: 2-dose schedule (countries with mumps in schedule and low transmission of measles)									
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTMumps2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMumpsEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for mumps vaccination" then "Client is not due for mumps vaccination Guidance"
    when "Client is due for mumps vaccination" then "Client is due for mumps vaccination Guidance"
    when "Mumps immunization schedule is complete" then "Mumps immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for mumps vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for mumps vaccination Case 1":
  Encounter."Client's age is less than 12 months"

/*
@output: Client is not due for mumps vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for mumps vaccination Case 2":
  Encounter."No mumps primary series doses were administered"
    and Encounter."Client's age is more than or equal to 12 months"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for mumps vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for mumps vaccination Case 3":
  Encounter."One mumps primary series dose was administered"
    and Encounter."The latest mumps dose was administered less than 4 weeks ago"

/*
@output: Client is not due for mumps vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for mumps vaccination Case 4":
  Encounter."One mumps primary series dose was administered"
    and Encounter."The latest mumps dose was administered more than 4 weeks ago"
    and Encounter."Live vaccine was administered in the past 4 weeks"

/*
@output: Client is not due for mumps vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for mumps vaccination":
  "Client is not due for mumps vaccination Case 1"
    or "Client is not due for mumps vaccination Case 2"
    or "Client is not due for mumps vaccination Case 3"
    or "Client is not due for mumps vaccination Case 4"

/*
@output: Client is not due for mumps vaccination Guidance
@guidance: Should not vaccinate client with first mumps dose as client's age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with first mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.
@guidance: Should not vaccinate client with second mumps dose as latest mumps dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
@guidance: Should not vaccinate client with second mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.
*/
define "Client is not due for mumps vaccination Guidance":
  case
    when "Client is not due for mumps vaccination Case 1" then 'Should not vaccinate client with first mumps dose as client\'s age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for mumps vaccination Case 2" then 'Should not vaccinate client with first mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when "Client is not due for mumps vaccination Case 3" then 'Should not vaccinate client with second mumps dose as latest mumps dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when "Client is not due for mumps vaccination Case 4" then 'Should not vaccinate client with second mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    else ''
  end

/*
@output: Client is due for mumps vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for mumps vaccination Case 1":
  Encounter."No mumps primary series doses were administered"
    and Encounter."Client's age is more than or equal to 12 months"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Client is due for mumps vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for mumps vaccination Case 2":
  Encounter."One mumps primary series dose was administered"
    and Encounter."The latest mumps dose was administered more than 4 weeks ago"
    and Encounter."No live vaccine was administered in the past 4 weeks"

/*
@output: Client is due for mumps vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for mumps vaccination":
  "Client is due for mumps vaccination Case 1"
    or "Client is due for mumps vaccination Case 2"

/*
@output: Client is due for mumps vaccination Guidance
@guidance: Should vaccinate client with first mumps dose as the client is within appropriate age range and no live vaccine was administered in the past 4 weeks.
Check for contraindications.
@guidance: Should vaccinate client with second mumps dose as latest mumps dose was administered more than 4 weeks ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.
*/
define "Client is due for mumps vaccination Guidance":
  case
    when "Client is due for mumps vaccination Case 1" then 'Should vaccinate client with first mumps dose as the client is within appropriate age range and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when "Client is due for mumps vaccination Case 2" then 'Should vaccinate client with second mumps dose as latest mumps dose was administered more than 4 weeks ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    else ''
  end

/*
@output: Mumps immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Mumps immunization schedule is complete":
  Encounter."Two mumps primary series doses were administered"

/*
@output: Mumps immunization schedule is complete Guidance
@guidance: Mumps immunization schedule is complete. Two mumps primary series doses were administered.
Check for any other vaccines due.
*/
define "Mumps immunization schedule is complete Guidance":
  'Mumps immunization schedule is complete. Two mumps primary series doses were administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "Client is not due for mumps vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first mumps dose as client\'s age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '09.124' then "Client is not due for mumps vaccination Case 2" and "Guidance" = 'Should not vaccinate client with first mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for first dose.'
    when Patient.id = '10.124' then "Client is due for mumps vaccination Case 1" and "Guidance" = 'Should vaccinate client with first mumps dose as the client is within appropriate age range and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '11.13' then "Client is not due for mumps vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second mumps dose as latest mumps dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '12.134' then "Client is not due for mumps vaccination Case 4" and "Guidance" = 'Should not vaccinate client with second mumps dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver of when to come back for the second dose.'
    when Patient.id = '13.134' then "Client is due for mumps vaccination Case 2" and "Guidance" = 'Should vaccinate client with second mumps dose as latest mumps dose was administered more than 4 weeks ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '14.1' then "Mumps immunization schedule is complete" and "Guidance" = 'Mumps immunization schedule is complete. Two mumps primary series doses were administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
