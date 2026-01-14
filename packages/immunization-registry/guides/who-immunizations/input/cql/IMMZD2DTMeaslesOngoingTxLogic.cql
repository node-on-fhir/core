
/*
 * Library: IMMZD2DTMeaslesOngoingTxLogic (IMMZ.D2.DT.Measles.Ongoing transmission)
 * Rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
 * Decision Table: Countries with ongoing transmission in which the risk of measles mortality remains high (countries that provide first dose of measles-containing vaccine (MCV) at 9 months and second dose of MCV at 15 months)
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any
 */
library IMMZD2DTMeaslesOngoingTxLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for first dose of measles-containing vaccine (MCV1)" then "Client is not due for first dose of measles-containing vaccine (MCV1) Guidance"
    when "Client is due for MCV1" then "Client is due for MCV1 Guidance"
    when "Client is not due for MCV1" then "Client is not due for MCV1 Guidance"
    when "Client is not due for second dose of measles-containing vaccine (MCV2)" then "Client is not due for second dose of measles-containing vaccine (MCV2) Guidance"
    when "Client is due for MCV2" then "Client is due for MCV2 Guidance"
    when "Client is not due for MCV2" then "Client is not due for MCV2 Guidance"
    when "Measles primary series is complete" then "Measles primary series is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for first dose of measles-containing vaccine (MCV1)
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for first dose of measles-containing vaccine (MCV1)":
  Encounter."Client's age is less than 9 months"

/*
@output: Client is not due for first dose of measles-containing vaccine (MCV1) Guidance
@guidance: Should not vaccinate client as client's age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.
*/
define "Client is not due for first dose of measles-containing vaccine (MCV1) Guidance":
  'Should not vaccinate client as client\'s age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.'

/*
@output: Client is due for MCV1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for MCV1":
  Encounter."No measles primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for MCV1 Guidance
@guidance: Should vaccinate client with MCV1 as no measles doses were administered, client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.
*/
define "Client is due for MCV1 Guidance":
  'Should vaccinate client with MCV1 as no measles doses were administered, client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.'

/*
@output: Client is not due for MCV1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV1":
  Encounter."No measles primary series doses were administered"
    and Encounter."Client's age is more than or equal to 9 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for MCV1 Guidance
@guidance: Should not vaccinate client with MCV1 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.
*/
define "Client is not due for MCV1 Guidance":
  'Should not vaccinate client with MCV1 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.'

/*
@output: Client is not due for second dose of measles-containing vaccine (MCV2)
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for second dose of measles-containing vaccine (MCV2)":
  Encounter."MCV1 was administered"
    and Encounter."Client's age is less than 15 months"

/*
@output: Client is not due for second dose of measles-containing vaccine (MCV2) Guidance
@guidance: Should not vaccinate client with MCV2 as client's age is less than 15 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.
*/
define "Client is not due for second dose of measles-containing vaccine (MCV2) Guidance":
  'Should not vaccinate client with MCV2 as client\'s age is less than 15 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.'

/*
@output: Client is due for MCV2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for MCV2":
  Encounter."MCV1 was administered"
    and Encounter."Client's age is more than or equal to 15 months"
    and Encounter."No live vaccine was administered in the last 4 weeks"

/*
@output: Client is due for MCV2 Guidance
@guidance: Should vaccinate client with MCV2 as client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.
*/
define "Client is due for MCV2 Guidance":
  'Should vaccinate client with MCV2 as client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.'

/*
@output: Client is not due for MCV2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for MCV2":
  Encounter."MCV1 was administered"
    and Encounter."Client's age is more than or equal to 15 months"
    and Encounter."Live vaccine was administered in the last 4 weeks"

/*
@output: Client is not due for MCV2 Guidance
@guidance: Should not vaccinate client with MCV2 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.
*/
define "Client is not due for MCV2 Guidance":
  'Should not vaccinate client with MCV2 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.'

/*
@output: Measles primary series is complete
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Measles-containing vaccines")
*/
define "Measles primary series is complete":
  Encounter."MCV2 was administered"

/*
@output: Measles primary series is complete Guidance
@guidance: Measles primary series is complete. Two measles primary series doses were administered.
Check if a measles supplementary dose is appropriate for the client.
*/
define "Measles primary series is complete Guidance":
  'Measles primary series is complete. Two measles primary series doses were administered.
Check if a measles supplementary dose is appropriate for the client.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case    when Patient.id = '08.Alt9m' then "Client is not due for first dose of measles-containing vaccine (MCV1)" and "Guidance" = 'Should not vaccinate client as client\'s age is less than 9 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.'
    when Patient.id = '09.Agt9mLVgt4w' then "Client is due for MCV1" and "Guidance" = 'Should vaccinate client with MCV1 as no measles doses were administered, client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '10.Agt9mLVlt4w' then "Client is not due for MCV1" and "Guidance" = 'Should not vaccinate client with MCV1 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV1.'
    when Patient.id = '11.D1Alt15m' then "Client is not due for second dose of measles-containing vaccine (MCV2)" and "Guidance" = 'Should not vaccinate client with MCV2 as client\'s age is less than 15 months.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.'
    when Patient.id = '12.D1Agt15mLVgt4w' then "Client is due for MCV2" and "Guidance" = 'Should vaccinate client with MCV2 as client is within appropriate age range and no live vaccine administered in the past 4 weeks.
Check for contraindications.'
    when Patient.id = '13.D1Agt15mLVlt4w' then "Client is not due for MCV2" and "Guidance" = 'Should not vaccinate client with MCV2 as live vaccine was administered in the past 4 weeks.
Check for any vaccines due and inform the caregiver of when to come back for MCV2.'
    when Patient.id = '14.D2' then "Measles primary series is complete" and "Guidance" = 'Measles primary series is complete. Two measles primary series doses were administered.
Check if a measles supplementary dose is appropriate for the client.'
    else 'No test case set'
  end
