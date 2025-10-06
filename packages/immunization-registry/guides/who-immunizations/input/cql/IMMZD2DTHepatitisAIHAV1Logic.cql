
/*
 * Library: IMMZD2DTHepatitisAIHAV1Logic (IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose)
 * Rule: Determine if the client is due for a hepatitis A vaccination according to the national immunization schedule
 * Decision Table: Inactivated hepatitis A virus (HAV), 1-dose schedule
 * Trigger: IMMZ.D2 Determine required vaccination(s) if any  
 */
library IMMZD2DTHepatitisAIHAV1Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTHepatitisAEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for Hepatitis A vaccination" then "Client is not due for Hepatitis A vaccination Guidance"
    when "Client is due for Hepatitis A vaccination" then "Client is due for Hepatitis A vaccination Guidance"
    when "Hepatitis A immunization schedule is complete" then "Hepatitis A immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for Hepatitis A vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for Hepatitis A vaccination":
  Encounter."Client's age is less than 12 months"

/*
@output: Client is not due for Hepatitis A vaccination Guidance
@guidance: Should not vaccinate client with Hepatitis A dose as client's age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.
*/
define "Client is not due for Hepatitis A vaccination Guidance":
  'Should not vaccinate client with Hepatitis A dose as client\'s age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'

/*
@output: Client is due for Hepatitis A vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for Hepatitis A vaccination":
  Encounter."No hepatitis A primary series dose was administered"
    and Encounter."Client's age is more than or equal to 12 months"

/*
@output: Client is due for Hepatitis A vaccination Guidance
@guidance: Should vaccinate client with hepatitis A dose as no hepatitis A dose was administered and client's age is within appropriate age range.
Check for contraindications.
*/
define "Client is due for Hepatitis A vaccination Guidance":
  'Should vaccinate client with hepatitis A dose as no hepatitis A dose was administered and client\'s age is within appropriate age range.
Check for contraindications.'

/*
@output: Hepatitis A immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Hepatitis A immunization schedule is complete":
  Encounter."One hepatitis A primary series dose was administered"

/*
@output: Hepatitis A immunization schedule is complete Guidance
@guidance: Hepatitis A immunization schedule is complete. One hepatitis A primary series dose was administered.
Check for any other vaccines due.
*/
define "Hepatitis A immunization schedule is complete Guidance":
  'Hepatitis A immunization schedule is complete. One hepatitis A primary series dose was administered.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '20.1' then "Client is not due for Hepatitis A vaccination" and "Guidance" = 'Should not vaccinate client with Hepatitis A dose as client\'s age is less than 12 months.
Check for any other vaccines due and inform the caregiver of when to come back for the first dose.'
    when Patient.id = '21.01' then "Client is due for Hepatitis A vaccination" and "Guidance" = 'Should vaccinate client with hepatitis A dose as no hepatitis A dose was administered and client\'s age is within appropriate age range.
Check for contraindications.'
    when Patient.id = '22.0' then "Hepatitis A immunization schedule is complete" and "Guidance" = 'Hepatitis A immunization schedule is complete. One hepatitis A primary series dose was administered.
Check for any other vaccines due.'
    else 'No test case set'
  end
