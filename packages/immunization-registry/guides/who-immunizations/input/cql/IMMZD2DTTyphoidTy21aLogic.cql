
/*
 * Library: IMMZD2DTTyphoidTy21aLogic (IMMZ.D2.DT.Typhoid.Ty21a)
 * Rule: Determine if the client is due for a typhoid vaccination according to the national immunization schedule
 * Decision Table: Live attenuated Ty21a vaccine schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTTyphoidTy21aLogic

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
    when "Client is not due for typhoid booster dose" then "Client is not due for typhoid booster dose Guidance"
    when "Client is due for typhoid booster dose" then "Client is due for typhoid booster dose Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Typhoid vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Typhoid vaccination Case 1":
  Encounter."Client's age is less than 6 years"

/*
@output: Client is not due for Typhoid vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Typhoid vaccination Case 2":
  Encounter."Client's age is more than or equal to 6 years"
    and Encounter."Primary series is not complete"
    and Encounter."Live vaccine, other than typhoid, was administered in the past 4 weeks"

/*
@output: Client is not due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Typhoid vaccination":
  "Client is not due for Typhoid vaccination Case 1"
    or "Client is not due for Typhoid vaccination Case 2"

/*
@output: Client is not due for Typhoid vaccination Guidance
@guidance: Should not vaccinate client with typhoid dose as client's age is less than 6 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
@guidance: Should not vaccinate client with typhoid dose as live vaccine was administered in the past 4 weeks.
Check for other vaccines due and inform the caregiver or the client when the next dose should be administered.
*/
define "Client is not due for Typhoid vaccination Guidance":
  case
    when "Client is not due for Typhoid vaccination Case 1" then 'Should not vaccinate client with typhoid dose as client\'s age is less than 6 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when "Client is not due for Typhoid vaccination Case 2" then 'Should not vaccinate client with typhoid dose as live vaccine was administered in the past 4 weeks.
Check for other vaccines due and inform the caregiver or the client when the next dose should be administered.'
    else ''
  end

/*
@output: Client is due for Typhoid vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Typhoid vaccination":
  Encounter."Client's age is more than or equal to 6 years"
    and Encounter."Primary series is not complete"
    and Encounter."No live vaccine, other than typhoid, was administered in the past 4 weeks"

/*
@output: Client is due for Typhoid vaccination Guidance
@guidance: Prescribe the Ty21a primary series (if not done yet). Should vaccinate client with typhoid dose as primary series has not been completed and no live vaccines was administered in the past 4 weeks.
Check for contraindications.
*/
define "Client is due for Typhoid vaccination Guidance":
  'Prescribe the Ty21a primary series (if not done yet). Should vaccinate client with typhoid dose as primary series has not been completed and no live vaccines was administered in the past 4 weeks.
Check for contraindications.'

/*
@output: Client is not due for typhoid booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for typhoid booster dose Case 1":
  Encounter."Client's age is more than or equal to 6 years"
    and Encounter."Primary series is complete"
    and Encounter."The latest typhoid dose was administered less than 3 years ago"

/*
@output: Client is not due for typhoid booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for typhoid booster dose Case 2":
  Encounter."Client's age is more than or equal to 6 years"
    and Encounter."Primary series is complete"
    and Encounter."The latest typhoid dose was administered more than 3 years ago"
    and Encounter."Live vaccine, other than typhoid, was administered in the past 4 weeks"

/*
@output: Client is not due for typhoid booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for typhoid booster dose":
  "Client is not due for typhoid booster dose Case 1"
    or "Client is not due for typhoid booster dose Case 2"

/*
@output: Client is not due for typhoid booster dose Guidance
@guidance: Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered.
@guidance: Should not vaccinate client with typhoid booster dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered
*/
define "Client is not due for typhoid booster dose Guidance":
  case
    when "Client is not due for typhoid booster dose Case 1" then 'Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered.'
    when "Client is not due for typhoid booster dose Case 2" then 'Should not vaccinate client with typhoid booster dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered'
    else ''
  end

/*
@output: Client is due for typhoid booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for typhoid booster dose":
  Encounter."Client's age is more than or equal to 6 years"
    and Encounter."Primary series is complete"
    and Encounter."The latest typhoid dose was administered more than 3 years ago"
    and Encounter."No live vaccine, other than typhoid, was administered in the past 4 weeks"

/*
@output: Client is due for typhoid booster dose Guidance
@guidance: Prescribe the Ty21a booster series. Should vaccinate client with typhoid booster dose as primary series has been completed, the latest typhoid dose was administered more than 3 years ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.
*/
define "Client is due for typhoid booster dose Guidance":
  'Prescribe the Ty21a booster series. Should vaccinate client with typhoid booster dose as primary series has been completed, the latest typhoid dose was administered more than 3 years ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '30.1' then "Client is not due for Typhoid vaccination Case 1" and "Guidance" = 'Should not vaccinate client with typhoid dose as client\'s age is less than 6 years.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '31.124' then "Client is due for Typhoid vaccination" and "Guidance" = 'Prescribe the Ty21a primary series (if not done yet). Should vaccinate client with typhoid dose as primary series has not been completed and no live vaccines was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '32.124' then "Client is not due for Typhoid vaccination Case 2" and "Guidance" = 'Should not vaccinate client with typhoid dose as live vaccine was administered in the past 4 weeks.
Check for other vaccines due and inform the caregiver or the client when the next dose should be administered.'
    when Patient.id = '33.123' then "Client is not due for typhoid booster dose Case 1" and "Guidance" = 'Should not vaccinate client with typhoid booster dose as the latest typhoid dose was administered less than 3 years ago.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered.'
    when Patient.id = '34.1234' then "Client is due for typhoid booster dose" and "Guidance" = 'Prescribe the Ty21a booster series. Should vaccinate client with typhoid booster dose as primary series has been completed, the latest typhoid dose was administered more than 3 years ago and no live vaccine was administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '35.1234' then "Client is not due for typhoid booster dose Case 2" and "Guidance" = 'Should not vaccinate client with typhoid booster dose as live vaccine was administered in the past 4 weeks.
Check for any other vaccines due and inform the caregiver or the client when the next dose should be administered'
    else 'No test case set'
  end
